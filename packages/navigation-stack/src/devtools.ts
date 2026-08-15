/**
 * navigation-stack devtools — a dev-only global inspector, mirroring state-stack's
 * `window.__STATE_STACK__` pattern rather than inventing a second one.
 *
 * Three audiences, and the design follows from the third:
 *
 *  1. A developer in the console: "what is actually on the stack right now, and why did that pop
 *     do nothing?"
 *  2. A bug report: `__NAV_STACK__.debug()` produces one pasteable JSON blob.
 *  3. **Playwright**, which is what makes this more than a toy — an E2E test can assert on real
 *     stack state instead of scraping the DOM, and can drive navigation deterministically instead
 *     of clicking through the UI and hoping.
 *
 * TWO CONSTRAINTS THAT SHAPE THE WHOLE API
 *
 * (a) EVERYTHING RETURNED MUST BE JSON-SERIALIZABLE. `page.evaluate()` structured-clones its
 *     return value, so handing back a React element, a function, or a live `api` object throws
 *     "could not be cloned" — the failure is confusing and only shows up under Playwright, never
 *     in the console. So the inspectors return plain data, deliberately, and params are sanitized
 *     rather than passed through.
 *
 * (b) E2E NORMALLY RUNS AGAINST A PRODUCTION BUILD. A devtool gated purely on
 *     `NODE_ENV === 'development'` is therefore invisible to exactly the tool it is meant to
 *     serve. Enabling is opt-in-able: automatic in non-production, and switchable on in any build
 *     by setting `window.__NAV_STACK_DEVTOOLS__ = true` before the app boots (e.g. Playwright's
 *     `addInitScript`). Never on by default in production.
 */
import { getRegistry } from './core/registry';
import { getPushDepth } from './core/persistence';
import { getOverlayStore } from './overlay/registry';
import { readOverlayFragment } from './overlay/hash';
import type { NavParams, StackEntry } from './types';

declare const __NAVSTACK_VERSION__: string;

export type NavEventKind =
  | 'push' | 'replace' | 'pop' | 'popUntil' | 'popToRoot'
  | 'pushAndPopUntil' | 'pushAndReplace' | 'go' | 'replaceParam'
  | 'popstate';

export type NavEvent = {
  t: number;
  stackId: string;
  kind: string;
  /** Stack depth before -> after. The cheapest way to see a pop that did not pop. */
  from: number;
  to: number;
  topKey: string | null;
  url: string;
  /** History entries this stack believes it owns, after the event. */
  pushDepth: number;
};

export type NavEntrySnapshot = { uid: string; key: string; params?: Record<string, unknown> };

export type NavSnapshot = {
  id: string;
  depth: number;
  entries: NavEntrySnapshot[];
  top: string | null;
  pushDepth: number;
  historySyncEnabled: boolean;
  currentState: string;
  isInGroup: boolean;
  groupId?: string;
  overlays: string[];
};

/**
 * Declared rather than pulled in via @types/node: this is a browser package and should not take a
 * Node types dependency. The literal `process.env.NODE_ENV` is kept intact on purpose — bundlers
 * substitute that exact expression, which is what lets the dev-only branch be stripped from a
 * production build. Reading it through globalThis would type-check equally well and defeat that.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

const RING = 200;
let _events: NavEvent[] = [];
let _enabled: boolean | null = null;

/** Only primitives survive; a params object can hold anything, including non-cloneable values. */
function safeParams(p: NavParams): Record<string, unknown> | undefined {
  if (!p || typeof p !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
    else out[k] = `[${typeof v}]`; // keep the key visible without breaking structured clone
  }
  return Object.keys(out).length ? out : undefined;
}

export function devtoolsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = (window as { __NAV_STACK_DEVTOOLS__?: boolean }).__NAV_STACK_DEVTOOLS__;
  if (typeof forced === 'boolean') return forced; // explicit opt-in/out always wins
  if (_enabled !== null) return _enabled;
  _enabled =
    typeof process === 'undefined' ||
    process.env?.NODE_ENV !== 'production';
  return _enabled;
}

/**
 * Called from the navigation funnel. Cheap and guarded: when devtools are off this is a single
 * boolean check, so it costs nothing in production.
 */
let _traceFn: ((e: NavEvent) => void) | null = null;

export function recordNavEvent(e: Omit<NavEvent, 't' | 'url'>): void {
  if (!devtoolsEnabled()) return;
  const full: NavEvent = {
    ...e,
    t: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };
  _events.push(full);
  if (_events.length > RING) _events = _events.slice(-RING);
  if (_traceFn) {
    try { _traceFn(full); } catch { /* a broken tracer must never break navigation */ }
  }
}

function snapshotOf(id: string): NavSnapshot | null {
  const reg = getRegistry().get(id);
  if (!reg) return null;
  const entries: StackEntry[] = reg.stack ?? [];
  return {
    id,
    depth: entries.length,
    entries: entries.map((e) => ({ uid: e.uid, key: e.key, params: safeParams(e.params) })),
    top: entries.length ? entries[entries.length - 1].key : null,
    pushDepth: getPushDepth(id),
    historySyncEnabled: !!reg.historySyncEnabled,
    currentState: reg.currentState ?? 'unknown',
    isInGroup: !!reg.isInGroup,
    groupId: reg.groupId,
    overlays: Array.from(getOverlayStore(id).entries.keys()),
  };
}

export const navDevtools = {
  /** Ids of every live stack. */
  stacks(): string[] {
    return Array.from(getRegistry().keys());
  },

  snapshot(stackId?: string): NavSnapshot | Record<string, NavSnapshot | null> | null {
    if (stackId) return snapshotOf(stackId);
    const out: Record<string, NavSnapshot | null> = {};
    for (const id of getRegistry().keys()) out[id] = snapshotOf(id);
    return out;
  },

  /**
   * Browser history as this library understands it.
   *
   * `historyLength` vs the summed `pushDepth` is the single most useful comparison when Back
   * misbehaves: if pushDepth is 0 while pages are stacked, nothing was pushed and Back will leave
   * the site — which is a different bug from Back popping twice.
   */
  history() {
    const depth: Record<string, number> = {};
    let owned = 0;
    for (const id of getRegistry().keys()) {
      depth[id] = getPushDepth(id);
      owned += depth[id];
    }
    return {
      historyLength: typeof window !== 'undefined' ? window.history.length : 0,
      ownedEntries: owned,
      byStack: depth,
      url: typeof window !== 'undefined' ? window.location.href : '',
      overlayFragment: readOverlayFragment(),
    };
  },

  overlays(scopeId?: string): Record<string, string[]> | string[] {
    if (scopeId) return Array.from(getOverlayStore(scopeId).entries.keys());
    const out: Record<string, string[]> = {};
    for (const id of getRegistry().keys()) {
      const keys = Array.from(getOverlayStore(id).entries.keys());
      if (keys.length) out[id] = keys;
    }
    return out;
  },

  /** Recent navigations, oldest first. Bounded ring buffer. */
  events(): NavEvent[] {
    return _events.slice();
  },

  clearEvents(): void {
    _events = [];
  },

  /**
   * Live console trace: every navigation prints as it happens.
   *
   * `events()` is a ring buffer you read AFTER the fact, which is the wrong shape for the question
   * a developer actually has at the devtools console — "I am about to press Back; show me what
   * fires." Reading a buffer afterwards cannot distinguish "no event fired" from "an event fired
   * and I am looking at the wrong entry". A line appearing the instant you press Back can.
   *
   *     __NAV_STACK__.trace()        // start
   *     __NAV_STACK__.trace(false)   // stop
   *
   * Prints e.g. `nav profile-stack popstate 2->1 top=profile_page pushDepth=1`, and lifecycle
   * hooks appear as their own `lifecycle:onExit` lines — so an exit path that fires with no
   * handler attached is visibly different from one that never fires at all.
   */
  trace(on = true): { ok: true; tracing: boolean } {
    _traceFn = on
      ? (e) => {
          const arrow = e.from === e.to ? `${e.to}` : `${e.from}->${e.to}`;
          // eslint-disable-next-line no-console
          console.log(
            `%cnav%c ${e.stackId} %c${e.kind}%c ${arrow} top=${e.topKey ?? '-'} pushDepth=${e.pushDepth}`,
            'color:#888', 'color:inherit', 'font-weight:bold', 'color:inherit',
          );
        }
      : null;
    return { ok: true, tracing: on };
  },

  /** One pasteable blob for a bug report. */
  debug() {
    return {
      // Injected at build time. It was hardcoded and had drifted several releases behind, which is
      // worse than absent in a bug report: it points the reader at the wrong source.
      version: typeof __NAVSTACK_VERSION__ === 'string' ? __NAVSTACK_VERSION__ : 'unknown',
      enabled: devtoolsEnabled(),
      stacks: this.snapshot(),
      history: this.history(),
      overlays: this.overlays(),
      events: this.events(),
    };
  },

  // ---- driving, for Playwright and for reproducing a bug by hand --------------------------

  async push(stackId: string, key: string, params?: NavParams) {
    const api = getRegistry().get(stackId)?.api;
    if (!api) return { ok: false, reason: 'unknown-stack' };
    const r = await api.push(key, params);
    return { ok: r !== false, result: typeof r === 'object' ? { ...r } : r, depth: api.length() };
  },

  async pop(stackId: string) {
    const api = getRegistry().get(stackId)?.api;
    if (!api) return { ok: false, reason: 'unknown-stack' };
    const before = api.length();
    const r = await api.pop();
    const after = api.length();
    // Reported explicitly: a pop that changes nothing is the exact shape of the live
    // "popped page comes back" bug, and it is easy to miss when only asserting on the DOM.
    return { ok: r !== false, before, after, popped: after < before };
  },

  async popToRoot(stackId: string) {
    const api = getRegistry().get(stackId)?.api;
    if (!api) return { ok: false, reason: 'unknown-stack' };
    const before = api.length();
    await api.popToRoot();
    return { ok: true, before, after: api.length() };
  },

  /**
   * Flip history behaviour at runtime, without a rebuild — this is the "set the behaviour of pop"
   * knob. Useful to A/B a suspected regression on a live page: toggle, repeat the gesture, compare.
   * Mirrors the `historyPush` prop.
   */
  setHistorySync(stackId: string, enabled: boolean) {
    const api = getRegistry().get(stackId)?.api;
    if (!api) return { ok: false, reason: 'unknown-stack' };
    api.syncWithBrowserHistory(enabled);
    return { ok: true, stackId, historySyncEnabled: enabled };
  },

  /** Wait until a stack reaches a depth, so tests need no arbitrary sleeps. */
  async waitForDepth(stackId: string, depth: number, timeoutMs = 3000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const reg = getRegistry().get(stackId);
      if (reg && (reg.stack?.length ?? 0) === depth) return true;
      await new Promise((r) => setTimeout(r, 25));
    }
    return false;
  },
};

export function installNavDevtools(): void {
  if (typeof window === 'undefined' || !devtoolsEnabled()) return;
  (window as unknown as Record<string, unknown>).__NAV_STACK__ = navDevtools;
}
