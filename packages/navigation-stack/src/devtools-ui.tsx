/**
 * <NavigationDevtools /> — the visual inspector.
 *
 * `window.__NAV_STACK__` (devtools.ts) is the programmatic surface for Playwright and the console.
 * This is the human one: a floating panel showing live stack state, a navigation timeline, and
 * controls to drive navigation while debugging.
 *
 * DESIGN CONSTRAINTS
 *  - Zero dependencies and zero cross-package imports (Library Charter). All styling is a scoped
 *    <style> tag with a namespaced class prefix, so it cannot collide with, or inherit from, the
 *    host app's CSS — a devtool that restyles the app it is debugging is worse than none.
 *  - Renders nothing unless devtools are enabled, so it is safe to leave mounted in app code.
 *  - Fixed position with a high z-index, and `pointer-events` scoped to the panel itself so it
 *    never swallows clicks meant for the app underneath.
 *  - Polls on an interval rather than subscribing: the registry has no global change feed, and a
 *    250ms poll is imperceptible for a debugging surface while keeping this decoupled from
 *    navigation internals.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { navDevtools, devtoolsEnabled, type NavEvent, type NavSnapshot } from './devtools';

const P = 'axnavdt'; // class prefix

type Tab = 'stacks' | 'events' | 'history' | 'overlays';

const ACTION_COLORS: Record<string, string> = {
  push: '#4ade80',
  pop: '#f87171',
  popToRoot: '#fb923c',
  popUntil: '#fb923c',
  replace: '#60a5fa',
  replaceParam: '#60a5fa',
  pushAndReplace: '#a78bfa',
  pushAndPopUntil: '#a78bfa',
  go: '#38bdf8',
  popstate: '#facc15',
};

const CSS = `
.${P}-root{position:fixed;z-index:2147483000;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.45;color:#e5e7eb}
.${P}-fab{position:fixed;bottom:16px;right:16px;z-index:2147483000;width:40px;height:40px;border-radius:10px;background:#111827;color:#e5e7eb;border:1px solid #374151;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.${P}-fab:hover{background:#1f2937}
.${P}-panel{display:flex;flex-direction:column;background:#0b0f19;border:1px solid #263042;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.55);overflow:hidden;resize:both}
.${P}-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#111827;border-bottom:1px solid #263042;cursor:move;user-select:none}
.${P}-title{font-weight:700;letter-spacing:.02em;color:#f9fafb}
.${P}-badge{padding:1px 6px;border-radius:999px;background:#1f2937;border:1px solid #374151;color:#9ca3af;font-size:10px}
.${P}-spacer{flex:1}
.${P}-btn{background:#1f2937;border:1px solid #374151;color:#e5e7eb;border-radius:6px;padding:3px 8px;cursor:pointer;font:inherit}
.${P}-btn:hover{background:#374151}
.${P}-btn[disabled]{opacity:.45;cursor:not-allowed}
.${P}-tabs{display:flex;gap:2px;padding:6px 8px;background:#0d1320;border-bottom:1px solid #263042}
.${P}-tab{background:transparent;border:1px solid transparent;color:#9ca3af;border-radius:6px;padding:3px 10px;cursor:pointer;font:inherit}
.${P}-tab[data-on="1"]{background:#1f2937;color:#f9fafb;border-color:#374151}
.${P}-body{flex:1;overflow:auto;padding:8px 10px}
.${P}-row{display:flex;align-items:center;gap:8px;padding:3px 0}
.${P}-k{color:#93c5fd}
.${P}-muted{color:#6b7280}
.${P}-warn{color:#fbbf24}
.${P}-ok{color:#4ade80}
.${P}-sec{margin:6px 0 4px;color:#9ca3af;text-transform:uppercase;font-size:10px;letter-spacing:.08em}
.${P}-card{border:1px solid #263042;border-radius:8px;padding:6px 8px;margin-bottom:6px;background:#0d1320}
.${P}-entry{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:6px;background:#111827;margin-bottom:3px;border-left:3px solid #374151}
.${P}-entry[data-top="1"]{border-left-color:#4ade80;background:#132018}
.${P}-ev{display:flex;gap:8px;align-items:baseline;padding:2px 0;border-bottom:1px dashed #1f2937}
.${P}-dot{width:7px;height:7px;border-radius:99px;flex:none}
.${P}-in{background:#0b0f19;border:1px solid #374151;color:#e5e7eb;border-radius:6px;padding:3px 6px;font:inherit;width:110px}
.${P}-empty{color:#6b7280;padding:10px 2px}
.${P}-scroll{max-height:100%;overflow:auto}
`;

function Copy({ get }: { get: () => unknown }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`${P}-btn`}
      title="Copy a JSON snapshot for a bug report"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(JSON.stringify(get(), null, 2));
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch { /* clipboard can be blocked; not worth surfacing */ }
      }}
    >
      {done ? 'copied' : 'copy'}
    </button>
  );
}

export type NavigationDevtoolsProps = {
  /** Start open. Default false — opens from the corner button. */
  defaultOpen?: boolean;
  /** Poll interval in ms. Default 250. */
  intervalMs?: number;
  /** Corner to anchor to. Default 'bottom-right'. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
};

export function NavigationDevtools({
  defaultOpen = false,
  intervalMs = 250,
  position = 'bottom-right',
}: NavigationDevtoolsProps) {
  const enabled = devtoolsEnabled();
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<Tab>('stacks');
  const [sel, setSel] = useState<string | null>(null);
  const [pushKey, setPushKey] = useState('');
  const [, force] = useState(0);
  const paused = useRef(false);

  // Live refresh. Paused while a menu/input is focused would be nicer, but a 250ms poll that
  // never blocks input is simpler and good enough for a debugging surface.
  useEffect(() => {
    if (!enabled || !open) return;
    const t = setInterval(() => { if (!paused.current) force((n) => n + 1); }, intervalMs);
    return () => clearInterval(t);
  }, [enabled, open, intervalMs]);

  // Alt+N toggles — chosen to avoid clashing with browser and OS shortcuts.
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [enabled]);

  const stacks = enabled && open ? (navDevtools.snapshot() as Record<string, NavSnapshot | null>) : {};
  const ids = useMemo(() => Object.keys(stacks), [stacks]);
  const active = sel && stacks[sel] ? sel : ids[0] ?? null;
  const snap = active ? stacks[active] : null;
  const hist = enabled && open ? navDevtools.history() : null;

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    await fn();
    force((n) => n + 1);
  }, []);

  if (!enabled) return null;

  const anchor: React.CSSProperties =
    position === 'bottom-right' ? { bottom: 16, right: 16 }
    : position === 'bottom-left' ? { bottom: 16, left: 16 }
    : position === 'top-right' ? { top: 16, right: 16 }
    : { top: 16, left: 16 };

  if (!open) {
    return (
      <>
        <style>{CSS}</style>
        <button className={`${P}-fab`} style={anchor} title="Navigation devtools (Alt+N)" onClick={() => setOpen(true)}>
          ⇄
        </button>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`${P}-root`} style={{ ...anchor, width: 420, height: 460 }}>
        <div className={`${P}-panel`} style={{ width: '100%', height: '100%' }}>
          <div className={`${P}-head`}>
            <span className={`${P}-title`}>navigation-stack</span>
            <span className={`${P}-badge`}>{ids.length} stack{ids.length === 1 ? '' : 's'}</span>
            <span className={`${P}-spacer`} />
            <Copy get={() => navDevtools.debug()} />
            <button className={`${P}-btn`} onClick={() => setOpen(false)} title="Close (Alt+N)">×</button>
          </div>

          <div className={`${P}-tabs`}>
            {(['stacks', 'events', 'history', 'overlays'] as Tab[]).map((t) => (
              <button key={t} className={`${P}-tab`} data-on={tab === t ? '1' : '0'} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className={`${P}-body`}>
            {tab === 'stacks' && (
              <>
                <div className={`${P}-row`} style={{ flexWrap: 'wrap' }}>
                  {ids.length === 0 && <div className={`${P}-empty`}>No stacks registered yet.</div>}
                  {ids.map((id) => (
                    <button
                      key={id}
                      className={`${P}-tab`}
                      data-on={active === id ? '1' : '0'}
                      onClick={() => setSel(id)}
                    >
                      {id} <span className={`${P}-muted`}>({stacks[id]?.depth ?? 0})</span>
                    </button>
                  ))}
                </div>

                {snap && (
                  <>
                    <div className={`${P}-card`}>
                      <div className={`${P}-row`}>
                        <span className={`${P}-k`}>depth</span><span>{snap.depth}</span>
                        <span className={`${P}-k`}>pushDepth</span>
                        <span className={snap.pushDepth === 0 && snap.depth > 1 ? `${P}-warn` : ''}>
                          {snap.pushDepth}
                        </span>
                        <span className={`${P}-k`}>syncHistory</span>
                        <span className={snap.historySyncEnabled ? `${P}-ok` : `${P}-muted`}>
                          {String(snap.historySyncEnabled)}
                        </span>
                      </div>
                      {snap.depth > 1 && snap.pushDepth === 0 && (
                        <div className={`${P}-warn`}>
                          ⚠ {snap.depth} pages deep but 0 history entries owned — browser Back will
                          leave the site instead of popping.
                        </div>
                      )}
                      <div className={`${P}-row`}>
                        <span className={`${P}-k`}>group</span>
                        <span className={`${P}-muted`}>{snap.isInGroup ? (snap.groupId ?? 'yes') : 'no'}</span>
                        <span className={`${P}-k`}>state</span>
                        <span className={`${P}-muted`}>{snap.currentState}</span>
                      </div>
                    </div>

                    <div className={`${P}-sec`}>stack (top first)</div>
                    {[...snap.entries].reverse().map((e, i) => (
                      <div key={e.uid} className={`${P}-entry`} data-top={i === 0 ? '1' : '0'}>
                        <span style={{ minWidth: 18 }} className={`${P}-muted`}>
                          {snap.entries.length - 1 - i}
                        </span>
                        <span style={{ fontWeight: 700 }}>{e.key}</span>
                        {e.params && <span className={`${P}-muted`}>{JSON.stringify(e.params)}</span>}
                      </div>
                    ))}

                    <div className={`${P}-sec`}>drive</div>
                    <div className={`${P}-row`}>
                      <input
                        className={`${P}-in`}
                        placeholder="route key"
                        value={pushKey}
                        onFocus={() => { paused.current = true; }}
                        onBlur={() => { paused.current = false; }}
                        onChange={(ev) => setPushKey(ev.target.value)}
                      />
                      <button
                        className={`${P}-btn`}
                        disabled={!pushKey}
                        onClick={() => run(() => navDevtools.push(active!, pushKey))}
                      >push</button>
                      <button
                        className={`${P}-btn`}
                        disabled={snap.depth <= 1}
                        onClick={() => run(() => navDevtools.pop(active!))}
                      >pop</button>
                      <button
                        className={`${P}-btn`}
                        disabled={snap.depth <= 1}
                        onClick={() => run(() => navDevtools.popToRoot(active!))}
                      >popToRoot</button>
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'events' && (
              <>
                <div className={`${P}-row`}>
                  <span className={`${P}-muted`}>most recent last</span>
                  <span className={`${P}-spacer`} />
                  <button className={`${P}-btn`} onClick={() => { navDevtools.clearEvents(); force((n) => n + 1); }}>
                    clear
                  </button>
                </div>
                {navDevtools.events().length === 0 && (
                  <div className={`${P}-empty`}>No navigations recorded yet.</div>
                )}
                {navDevtools.events().map((ev: NavEvent, i) => (
                  <div key={i} className={`${P}-ev`}>
                    <span className={`${P}-dot`} style={{ background: ACTION_COLORS[ev.kind] ?? '#6b7280' }} />
                    <span style={{ minWidth: 96 }}>{ev.kind}</span>
                    <span className={`${P}-muted`} style={{ minWidth: 78 }}>{ev.stackId}</span>
                    <span className={ev.from === ev.to ? `${P}-warn` : ''}>
                      {ev.from}→{ev.to}
                    </span>
                    <span className={`${P}-muted`}>{ev.topKey ?? '—'}</span>
                    <span className={`${P}-spacer`} />
                    <span className={`${P}-muted`}>d{ev.pushDepth}</span>
                  </div>
                ))}
              </>
            )}

            {tab === 'history' && hist && (
              <>
                <div className={`${P}-card`}>
                  <div className={`${P}-row`}>
                    <span className={`${P}-k`}>history.length</span><span>{hist.historyLength}</span>
                    <span className={`${P}-k`}>owned</span>
                    <span className={hist.ownedEntries === 0 ? `${P}-warn` : `${P}-ok`}>{hist.ownedEntries}</span>
                  </div>
                  <div className={`${P}-muted`}>
                    “owned” counts entries this library pushed. Pops are clamped to it, so a
                    deep-linked user is never sent off the front of history.
                  </div>
                </div>
                <div className={`${P}-sec`}>per stack</div>
                {Object.entries(hist.byStack).map(([id, d]) => (
                  <div key={id} className={`${P}-row`}>
                    <span style={{ minWidth: 120 }}>{id}</span>
                    <span className={d === 0 ? `${P}-muted` : `${P}-ok`}>{d}</span>
                  </div>
                ))}
                <div className={`${P}-sec`}>url</div>
                <div className={`${P}-muted`} style={{ wordBreak: 'break-all' }}>{hist.url}</div>
                <div className={`${P}-sec`}>overlay fragment</div>
                <div className={`${P}-muted`}>{hist.overlayFragment ?? '(none)'}</div>
              </>
            )}

            {tab === 'overlays' && (
              <>
                {Object.entries(navDevtools.overlays() as Record<string, string[]>).length === 0 && (
                  <div className={`${P}-empty`}>No overlays registered.</div>
                )}
                {Object.entries(navDevtools.overlays() as Record<string, string[]>).map(([scope, keys]) => (
                  <div key={scope} className={`${P}-card`}>
                    <div style={{ fontWeight: 700 }}>{scope}</div>
                    {keys.map((k) => <div key={k} className={`${P}-muted`}>· {k}</div>)}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default NavigationDevtools;
