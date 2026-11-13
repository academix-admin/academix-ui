import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  GroupNavigationStack,
  ViewportInsetsProvider,
  popStackToRoot,
  scrollBroadcaster,
  useResizeToAvoidKeyboard,
  useRevealTappedInRows,
  type ViewportInsetsOptions,
} from '@academix-admin/navigation-stack';
import NavigationBar, { type NavigationBarProps, type NavigationBarVisibility } from '@academix-admin/navigation-bar';
import Sidebar, { type SidebarProps } from '@academix-admin/sidebar';
import { createBarStore, type BarStore } from './bar-store';
import { shellCss } from './styles';

/** One tab: its place in the tab bar and the sidebar, and the navigation stack behind it. */
export interface AppShellTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  /**
   * The tab's navigation stack — a `<NavigationStack>`, or a component that renders one. Mounted once
   * and kept: a tab you leave is still where you left it when you come back. Read when the list of tab
   * ids changes, not on every render.
   */
  stack: React.ReactElement;
}

export interface AppShellClassNames {
  root?: string;
  row?: string;
  side?: string;
  stacks?: string;
  bar?: string;
}

export interface AppShellProps {
  /** Names the group of stacks (history, persistence) and scopes the shell's CSS. Default `"app"`. */
  id?: string;
  tabs: AppShellTab[];
  /** The tab on screen, when you hold it yourself. Leave it out and the shell keeps it. */
  active?: string;
  /** The first tab, when the shell keeps it. Default: the first in `tabs`. */
  defaultActive?: string;
  onActiveChange?: (id: string) => void;
  /** At the head of the sidebar. */
  logo?: React.ReactNode;
  /** At the foot of the sidebar. */
  sidebarFooter?: React.ReactNode;
  /**
   * The width, in px, at and below which the app is a phone: a tab bar at the foot. Wider, a sidebar
   * at the left and the pages beside it. Default 800.
   */
  breakpoint?: number;
  /** No tab bar and no sidebar — a game in play, a full-screen flow. The stacks keep their place. */
  immersive?: boolean;
  /**
   * Behave like an installed app when the keyboard comes up (default true): the shell is sized to the
   * visible area above the keyboard, the document is held still so iOS cannot drag the app up, and the
   * tab bar steps aside while a keyboard is up. Sets up navigation-stack's `ViewportInsetsProvider`
   * and `useResizeToAvoidKeyboard`; an app that also mounts the provider shares the one listener.
   */
  keyboardSafe?: boolean;
  /** Scroll a focused field clear of the keyboard (navigation-stack). Default true. */
  revealFocusedField?: ViewportInsetsOptions['revealFocusedField'];
  /** Tapping the tab already open returns it to its first page, as a native tab bar does. Default true. */
  reselectToRoot?: boolean;
  /** A card tapped in a sideways row scrolls fully into view (navigation-stack). Default true. */
  revealTappedInRows?: boolean;
  /** Keep each tab's pages across a reload (navigation-stack). Default true. */
  persist?: boolean;
  /** The phone's Back pops the page of the tab on screen, never another tab's. Default true. */
  backStaysInTab?: boolean;
  /** The tab bar's look and floating button (`@academix-admin/navigation-bar`), over the shell's defaults. */
  navigationBar?: Partial<Omit<NavigationBarProps, 'navKeys' | 'activeId' | 'onChange' | 'onReselect' | 'onVisibilityChange' | 'media'>>;
  /** The sidebar's look (`@academix-admin/sidebar`), over the shell's defaults. */
  sidebar?: Partial<Omit<SidebarProps, 'navKeys' | 'activeId' | 'onChange' | 'onReselect' | 'logo' | 'footer'>>;
  className?: string;
  classNames?: AppShellClassNames;
  /** Drawn inside the shell, after the pages — for something that belongs to the whole app. */
  children?: React.ReactNode;
}

interface ShellContext {
  active: string;
  setActive: (id: string) => void;
  bar: BarStore;
  immersive: boolean;
}

const Ctx = createContext<ShellContext | null>(null);

/** The shell around this component: the tab on screen, and a way to open another. */
export function useAppShell(): { active: string; setActive: (id: string) => void; immersive: boolean } {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAppShell must be used inside <AppShell>.');
  return { active: c.active, setActive: c.setActive, immersive: c.immersive };
}

/**
 * Where the tab bar is: hidden or shown, and how tall. `null` until the bar has reported — and on a
 * wide screen, where there is no bar, it reports itself hidden. Re-renders only what reads it.
 */
export function useAppShellBar(): NavigationBarVisibility | null {
  const c = useContext(Ctx);
  const store = c?.bar;
  const subscribe = useCallback((l: () => void) => (store ? store.subscribe(l) : () => {}), [store]);
  return useSyncExternalStore(subscribe, () => store?.get() ?? null, () => null);
}

const BAR_DEFAULTS: Partial<NavigationBarProps> = {
  mode: 'autohide',
  normalHeight: '72px',
  shrinkHeight: '0px',
  iconSize: '22px',
  textSize: '12px',
  fontWeight: 600,
  itemSpacing: '8px',
  paddingX: '0px',
  paddingY: '0px',
  breakpointSpacing: { '800': '32px', '500': '24px', '0': '16px' },
  barBorderRadius: '16px 16px 0 0',
  barBorderTop: '1px solid var(--ax-shell-border, #e2e5e7)',
  barShadow: 'var(--ax-shell-bar-shadow, 0 -4px 20px rgba(0, 0, 0, 0.08))',
  backgroundColor: 'var(--ax-shell-surface, #ffffff)',
  activeColor: 'var(--ax-shell-accent, #2563eb)',
  inactiveColor: 'var(--ax-shell-muted, #5b6168)',
  hoverColor: 'var(--ax-shell-accent-hover, #1d4ed8)',
  floatingButtonPosition: 'left',
  floatingButtonBottom: '16px',
  floatingButtonPadding: '16px',
  floatingButtonColor: 'var(--ax-shell-accent, #2563eb)',
  floatingButtonTextColor: 'var(--ax-shell-on-accent, #ffffff)',
  floatingButtonRadius: '50%',
  floatingButtonShadow: 'var(--ax-shell-button-shadow, 0 6px 12px rgba(0, 0, 0, 0.25))',
};

const SIDEBAR_DEFAULTS: Partial<SidebarProps> = {
  backgroundColor: 'var(--ax-shell-surface, #ffffff)',
  activeColor: 'var(--ax-shell-accent, #2563eb)',
  inactiveColor: 'var(--ax-shell-muted, #5b6168)',
  hoverColor: 'var(--ax-shell-accent-hover, #1d4ed8)',
  activeBackground: 'var(--ax-shell-accent-subtle, rgba(37, 99, 235, 0.1))',
  hoverBackground: 'var(--ax-shell-hover-bg, rgba(0, 0, 0, 0.04))',
  dividerColor: 'var(--ax-shell-border, #e2e5e7)',
  toggleColor: 'var(--ax-shell-muted, #5b6168)',
  borderRight: '1px solid var(--ax-shell-border, #e2e5e7)',
  shadow: 'none',
  height: '100%',
  widthExpanded: '232px',
  widthCollapsed: '68px',
  textSize: '15px',
  iconSize: '22px',
  fontWeight: 600,
};

const cx = (...names: (string | undefined | false)[]) => names.filter(Boolean).join(' ');

/**
 * AN INSTALLED APP'S FRAME, FROM ONE COMPONENT.
 *
 * One navigation stack per tab, kept alive; a tab bar on a phone and a sidebar on a wide screen, fed
 * the same tabs; the frame sized to what the keyboard leaves; the bar out of the way while typing; the
 * phone's safe areas respected; tap the open tab to go back to its first page; Back that stays in the
 * tab. Everything else — the pages, the look — is yours.
 */
export function AppShell({
  id = 'app',
  tabs,
  active: activeProp,
  defaultActive,
  onActiveChange,
  logo,
  sidebarFooter,
  breakpoint = 800,
  immersive = false,
  keyboardSafe = true,
  revealFocusedField = true,
  reselectToRoot = true,
  revealTappedInRows = true,
  persist = true,
  backStaysInTab = true,
  navigationBar,
  sidebar,
  className,
  classNames,
  children,
}: AppShellProps) {
  const [own, setOwn] = useState(() => defaultActive ?? tabs[0]?.id ?? '');
  const chosen = activeProp ?? own;
  // A tab that went (a permission taken away, a role switched) leaves the shell on one that is there.
  const active = tabs.some((t) => t.id === chosen) ? chosen : tabs[0]?.id ?? '';

  // Told only of a change: the stack group reports the tab it is on when it mounts, which is not one.
  const activeRef = useRef(active);
  activeRef.current = active;
  const setActive = useCallback(
    (next: string) => {
      if (next === activeRef.current) return;
      if (activeProp === undefined) setOwn(next);
      onActiveChange?.(next);
    },
    [activeProp, onActiveChange],
  );

  // The stacks are built when the set of tabs changes, not on every render: a new Map on each render
  // would hand the group new elements every time the shell re-renders.
  const signature = tabs.map((t) => t.id).join('\u0000');
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const navStack = useMemo(
    () => new Map(tabsRef.current.map((t) => [t.id, t.stack] as const)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );
  const navKeys = tabs.map((t) => ({ id: t.id, text: t.label, svg: t.icon }));

  const barRef = useRef<BarStore | null>(null);
  if (!barRef.current) barRef.current = createBarStore();
  const bar = barRef.current;

  useResizeToAvoidKeyboard({ enabled: keyboardSafe });
  useRevealTappedInRows({ enabled: revealTappedInRows });

  const onReselect = reselectToRoot ? (tab: string) => popStackToRoot(tab) : undefined;
  const context = useMemo(() => ({ active, setActive, bar, immersive }), [active, setActive, bar, immersive]);

  return (
    <Ctx.Provider value={context}>
      <style data-ax-shell-style={id} dangerouslySetInnerHTML={{ __html: shellCss(id, breakpoint, keyboardSafe) }} />
      {keyboardSafe && <ViewportInsetsProvider revealFocusedField={revealFocusedField} />}
      <div
        data-ax-shell={id}
        data-immersive={immersive || undefined}
        className={cx('ax-shell', className, classNames?.root)}
      >
        <div className={cx('ax-shell__row', classNames?.row)}>
          {!immersive && (
            <div className={cx('ax-shell__side', classNames?.side)}>
              <Sidebar
                {...SIDEBAR_DEFAULTS}
                {...sidebar}
                id={sidebar?.id ?? `${id}-sidebar`}
                navKeys={navKeys}
                activeId={active}
                onChange={(next) => setActive(next)}
                onReselect={onReselect}
                logo={logo}
                footer={sidebarFooter}
              />
            </div>
          )}
          <div className={cx('ax-shell__stacks', classNames?.stacks)}>
            <GroupNavigationStack
              id={`${id}-group`}
              current={active}
              navStack={navStack}
              onCurrentChange={setActive}
              persist={persist}
              backStaysInTab={backStaysInTab}
            />
          </div>
        </div>
        {!immersive && (
          <div className={cx('ax-shell__bar', classNames?.bar)}>
            <NavigationBar
              onScroll={(callback) => scrollBroadcaster.subscribe(callback)}
              {...BAR_DEFAULTS}
              {...navigationBar}
              navKeys={navKeys}
              activeId={active}
              onChange={(next) => setActive(next)}
              onReselect={onReselect}
              onVisibilityChange={(state) => bar.set(state)}
              media={`(max-width: ${breakpoint}px)`}
            />
          </div>
        )}
        {children}
      </div>
    </Ctx.Provider>
  );
}
