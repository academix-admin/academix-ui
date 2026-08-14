import type { NavParams, NavigationMap, ParsedStack, StackEntry } from '../types';
import { NAV_STACK_VERSION, STACK_SEPARATOR, STORAGE_TTL_MS } from '../constants';
import type { GroupNavigationContextType } from './contexts';
// Stack persistence, URL/param encoding and uid helpers.
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function isEqual(a: StackEntry[], b: StackEntry[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, i) =>
    entry.key === b[i].key &&
    JSON.stringify(entry.params) === JSON.stringify(b[i].params)
  );
}

export function generateStableUid(key: string, params?: NavParams): string {
  const str = key + (params ? JSON.stringify(params) : '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `uid_${Math.abs(hash)}`;
}

// Generate composite UID: "groupId:stackId:pageUid"
export function generateCompositeUid(
  stackId: string,
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  key: string,
  params?: NavParams
): string {
  const groupStackKey = groupContext
    ? `${groupContext.getGroupId()}:${groupStackId}`
    : 'root:root';
  const pageUid = generateStableUid(key, params);
  return `${groupStackKey}:${pageUid}`;
}

// Ensure UID is composite format - upgrade old non-composite UIDs if needed
export function ensureCompositeUid(
  uid: string | undefined,
  stackId: string,
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  key: string,
  params?: NavParams
): string {
  // If already composite (contains ':'), return as-is
  if (uid && uid.includes(':')) {
    return uid;
  }
  // Otherwise regenerate as composite
  return generateCompositeUid(stackId, groupContext, groupStackId, key, params);
}

export function parseRawKey(raw: string, params?: NavParams) {
  if (!raw) return { key: '', params };

  const [k, qs] = raw.split("?");
  let merged = params;
  if (qs) {
    try {
      const sp = new URLSearchParams(qs);
      const obj = Object.fromEntries(sp.entries());
      merged = merged ? { ...merged, ...obj } : obj;
    } catch (e) { }
  }
  return { key: k, params: merged };
}

export function storageKeyFor(id: string) {
  return `navstack:${id}`;
}

export function readPersistedStack(id: string, groupContext: GroupNavigationContextType | null, groupStackId: string | null): StackEntry[] | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(storageKeyFor(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; entries: any[] };
    if (!parsed.timestamp || !parsed.entries || !Array.isArray(parsed.entries)) return null;
    const expired = Date.now() - parsed.timestamp > STORAGE_TTL_MS;
    if (expired) {
      sessionStorage.removeItem(storageKeyFor(id));
      return null;
    }
    return parsed.entries.map((p) => {
      const compositeUid = ensureCompositeUid(p.uid, id, groupContext, groupStackId, p.key, p.params);
      return { uid: compositeUid, key: p.key, params: p.params, metadata: p.metadata };
    });
  } catch (e) {
    return null;
  }
}

export function writePersistedStack(id: string, stack: StackEntry[]) {
  try {
    if (typeof window === "undefined") return;
    const simplified = {
      timestamp: Date.now(),
      entries: stack.map((s) => ({ key: s.key, params: s.params, metadata: s.metadata })),
    };
    sessionStorage.setItem(storageKeyFor(id), JSON.stringify(simplified));
  } catch (e) { }
}

export function encodeStackPath(navLink: NavigationMap, key: string): string {
  const keys = Object.keys(navLink);
  const index = keys.indexOf(key);

  if (index === -1) {
    try {
      return 'k:' + encodeURIComponent(key);
    } catch {
      return 'k:' + key;
    }
  }
  if (index < 26) return String.fromCharCode(97 + index) + '1';
  if (index < 52) return 'a' + String.fromCharCode(65 + index - 26);

  const firstChar = String.fromCharCode(97 + Math.floor((index - 52) / 26));
  const secondChar = String.fromCharCode(97 + ((index - 52) % 26));
  return `${firstChar}${secondChar}1`;
}

export function decodeStackPath(navLink: NavigationMap, code: string): string | null {
  if (code.startsWith('k:')) {
    try {
      return decodeURIComponent(code.slice(2));
    } catch {
      return code.slice(2);
    }
  }

  const keys = Object.keys(navLink);

  if (code.length === 2 && code[1] === '1' && code[0] >= 'a' && code[0] <= 'z') {
    const index = code.charCodeAt(0) - 97;
    return keys[index] || null;
  }

  if (code.length === 2 && code[0] === 'a' && code[1] >= 'A' && code[1] <= 'Z') {
    const index = 26 + (code.charCodeAt(1) - 65);
    return keys[index] || null;
  }

  if (code.length === 3 && code[2] === '1' &&
    code[0] >= 'a' && code[0] <= 'z' &&
    code[1] >= 'a' && code[1] <= 'z') {
    const first = code.charCodeAt(0) - 97;
    const second = code.charCodeAt(1) - 97;
    const index = 52 + (first * 26) + second;
    return keys[index] || null;
  }

  return null;
}

export function encodeParams(params: NavParams): string {
  if (!params) return '';
  try {
    return 'p:' + btoa(encodeURIComponent(JSON.stringify(params)));
  } catch {
    return '';
  }
}

export function decodeParams(encoded: string): NavParams {
  if (!encoded.startsWith('p:')) return undefined;
  try {
    return JSON.parse(decodeURIComponent(atob(encoded.slice(2))));
  } catch {
    return undefined;
  }
}

export function buildUrlPath(stacks: Array<{ navLink: NavigationMap, stack: StackEntry[] }>): string {
  let path = NAV_STACK_VERSION;

  stacks.forEach(({ navLink, stack }, depth) => {
    if (depth > 0) path += '.' + STACK_SEPARATOR;

    stack.forEach(entry => {
      const code = encodeStackPath(navLink, entry.key);
      if (!code) return;

      path += '.' + code;

      if (entry.params) {
        const paramsStr = encodeParams(entry.params);
        if (paramsStr) path += '.' + paramsStr;
      }
    });
  });

  return path;
}

export function parseUrlPathIntoStacks(path: string) {
  const parts = path.split('.');
  if (parts[0] !== NAV_STACK_VERSION) return [];

  const stacks: ParsedStack[] = [];
  let currentStack: ParsedStack = [];

  for (let i = 1; i < parts.length; i++) {
    const token = parts[i];
    if (!token) continue;

    if (token === STACK_SEPARATOR) {
      if (currentStack.length > 0) {
        stacks.push(currentStack);
      } else {
        stacks.push([]);
      }
      currentStack = [];
      continue;
    }

    if (token.startsWith('p:')) {
      if (currentStack.length > 0) {
        currentStack[currentStack.length - 1].params = decodeParams(token);
      }
      continue;
    }

    currentStack.push({ code: token });
  }

  stacks.push(currentStack);

  return stacks;
}

export function parseCombinedNavParam(navParam: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!navParam) return map;
  try {
    navParam.split('|').forEach(segment => {
      if (!segment) return;
      const idx = segment.indexOf(':');
      if (idx === -1) return;
      const id = segment.slice(0, idx);
      const path = segment.slice(idx + 1);
      if (id) map[id] = path;
    });
  } catch (e) {
  }
  return map;
}

export function buildCombinedNavParam(map: Record<string, string>): string {
  return Object.keys(map)
    .filter(k => map[k] && map[k].length > 0)
    .map(k => `${k}:${map[k]}`)
    .join('|');
}

/**
 * How many history entries THIS stack has pushed.
 *
 * Bookkeeping, not decoration: `history.go(-n)` is not clamped by the browser to the entries we
 * created, so popping deeper than we pushed walks off the front of our own history and out of the
 * app entirely — e.g. a user who deep-linked straight into a nested page has 1 entry, not 4, and a
 * naive popToRoot would send them back to whatever site they came from. Every consume is clamped
 * against this counter.
 */
const _pushDepth = new Map<string, number>();

/**
 * The stack depth at which each owned history entry was created, oldest first.
 *
 * A bare counter is not enough, because one navigation can change several stack levels at once. A
 * deep link or a `go` that lands three pages deep creates ONE browser entry (one user action = one
 * Back press), so a later popToRoot must give back ONE entry — not three. Counting levels instead
 * of entries drifts the two apart, and the drift only shows up later as Back going somewhere
 * unexpected.
 *
 * Recording the depth each entry was created at makes the question exact: popping to depth D gives
 * back precisely the entries recorded above D.
 */
const _entryDepths = new Map<string, number[]>();

/**
 * Monotonic counter stamped onto every history entry this library writes.
 *
 * `history.go(-n)` is asynchronous: it queues the move and returns, so a popstate can arrive after
 * other work has already run. A serial makes each entry say which generation of navigation state it
 * is, so an arrival can be recognised as already-applied (skip the rebuild) or out of order
 * (diagnosable) instead of being inferred from a URL that any other writer may have rewritten
 * since.
 *
 * Deliberately process-wide rather than per stack: entries are global, and a single ordering across
 * all of them is what makes "did this arrive out of order" answerable at all.
 */
let _serial = 0;

export function nextSerial(): number {
  _serial += 1;
  return _serial;
}

/** Shape this library stores in `history.state`. Foreign keys on the same object are preserved. */
export type AxHistoryState = {
  /** Combined `stackId:path|stackId:path` for EVERY stack — the same string as `?nav=`. */
  navStack: string | null;
  /** Active group stack id, when inside a group. */
  group?: string;
  /** Generation of this entry. */
  axSerial: number;
};

/** Read our slice of an entry's state, if this entry was written by us. */
export function readAxState(state: unknown): AxHistoryState | null {
  if (!state || typeof state !== 'object') return null;
  const s = state as Partial<AxHistoryState>;
  if (typeof s.axSerial !== 'number') return null;      // not ours, or written before serials
  if (typeof s.navStack !== 'string' && s.navStack !== null) return null;
  return { navStack: s.navStack ?? null, group: s.group, axSerial: s.axSerial };
}

export function getPushDepth(stackId: string): number {
  return _pushDepth.get(stackId) ?? 0;
}

/** Depths at which this stack owns history entries (oldest first). Exposed for devtools/tests. */
export function getEntryDepths(stackId: string): number[] {
  return (_entryDepths.get(stackId) ?? []).slice();
}

/** Record that an entry was created while the stack was `depth` deep. */
export function recordEntryDepth(stackId: string, depth: number): void {
  const list = _entryDepths.get(stackId) ?? [];
  list.push(depth);
  _entryDepths.set(stackId, list);
}

/**
 * How many owned entries sit above `targetDepth` — i.e. how many to hand back when popping to it.
 * Also drops them from the ledger, so this is called once per pop.
 */
export function takeEntriesAboveDepth(stackId: string, targetDepth: number): number {
  const list = _entryDepths.get(stackId) ?? [];
  let n = 0;
  while (list.length > 0 && list[list.length - 1] > targetDepth) {
    list.pop();
    n += 1;
  }
  _entryDepths.set(stackId, list);
  return n;
}

export function resetPushDepth(stackId: string): void {
  _pushDepth.delete(stackId);
  _entryDepths.delete(stackId);
}

/**
 * Give back up to `requested` history entries that this stack pushed.
 * Returns how many were actually consumed (0 when we pushed none — a deep link).
 *
 * The caller has ALREADY mutated the stack. The resulting `popstate` re-derives the stack from the
 * restored URL and finds it identical, so the rebuild is a no-op (see the isEqual guard in
 * components.tsx). That is what keeps programmatic pop and browser-back from double-popping.
 */
export function consumeHistoryEntries(stackId: string, requested: number): number {
  if (typeof window === "undefined" || requested <= 0) return 0;
  const available = getPushDepth(stackId);
  const n = Math.min(requested, available);
  if (n <= 0) return 0;
  _pushDepth.set(stackId, available - n);
  try {
    window.history.go(-n);
  } catch {
    return 0;
  }
  return n;
}

export function updateNavQueryParamForStack(
  stackId: string,
  path: string | null,
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  /**
   * 'push' adds a real history entry so the browser's own back/forward (and therefore the
   * platform's back gesture) can step through the stack. 'replace' keeps the previous behaviour of
   * overwriting the current entry. Defaults to 'replace' so every existing caller is unchanged.
   */
  mode: 'push' | 'replace' = 'replace',
  /** Stack depth this entry represents; recorded so pops can give back the right number. */
  depthForLedger?: number,
) {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const current = url.searchParams.get('nav');
    const map = parseCombinedNavParam(current || undefined);

    if (path && path.length > 0) {
      map[stackId] = path;
    } else {
      delete map[stackId];
    }

    const newParam = buildCombinedNavParam(map);

    if (newParam) {
      if (groupContext) url.searchParams.set('group', groupStackId || '');
      url.searchParams.set('nav', newParam);
    } else {
      if (groupContext) url.searchParams.delete('group');
      url.searchParams.delete('nav');
    }

    const newHref = url.toString();
    if (window.location.href !== newHref) {
      if (mode === 'push') {
        // One pushState only. Calling it twice (as the replace path does for groups) would create
        // two entries for a single navigation, so back would need two presses to move one page.
        window.history.pushState(
          { ...(window.history.state ?? {}), navStack: newParam, group: groupContext ? groupStackId : undefined, axSerial: nextSerial() },
          "",
          newHref,
        );
        _pushDepth.set(stackId, getPushDepth(stackId) + 1);
        // Ledger the stack depth this entry represents, so a later pop gives back the right count
        // even when one navigation moved several levels.
        if (typeof depthForLedger === 'number') recordEntryDepth(stackId, depthForLedger);
      } else {
        // ONE replaceState carrying both fields, matching the push branch above.
        //
        // This used to write twice — `{ group }` then `{ navStack }` — and the second call
        // REPLACES state wholesale rather than merging, so `group` was silently dropped. Pushed
        // entries carried { navStack, group } while replaced entries carried only { navStack }, so
        // the same logical position had two different state shapes depending on how it was reached.
        // Anything branching on `event.state.group` during popstate therefore behaved differently
        // for the same page.
        window.history.replaceState(
          { ...(window.history.state ?? {}), navStack: newParam, group: groupContext ? groupStackId : undefined, axSerial: nextSerial() },
          "",
          newHref,
        );
      }
    }
  } catch (e) {
  }
}
export function removeNavQueryParamForStack(stackId: string, groupContext: GroupNavigationContextType | null, groupStackId: string | null) {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);

    if (groupContext) url.searchParams.delete('group');
    url.searchParams.delete('nav');


    const newHref = url.toString();
    if (window.location.href !== newHref) {
      if (groupContext) window.history.replaceState({ group: null }, "", newHref);
      window.history.replaceState({ navStack: null }, "", newHref);
    }
  } catch (e) {
  }
}


