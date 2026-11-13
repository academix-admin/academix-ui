import React, { useEffect } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { AppShell, useAppShell, useAppShellBar, type AppShellTab } from '../src';

let mounts: Record<string, number> = {};
function Stack({ name }: { name: string }) {
  useEffect(() => {
    mounts[name] = (mounts[name] ?? 0) + 1;
  }, [name]);
  return <p>{name} page</p>;
}
const icon = <svg aria-hidden="true" />;
const tabs = (): AppShellTab[] => [
  { id: 'sell', label: 'Sell', icon, stack: <Stack name="sell" /> },
  { id: 'stock', label: 'Stock', icon, stack: <Stack name="stock" /> },
];

afterEach(() => {
  cleanup();
  mounts = {};
  document.documentElement.removeAttribute('data-ax-keyboard');
});

describe('AppShell', () => {
  it('gives the same tabs to the tab bar and the sidebar, and draws every stack', () => {
    // A phone-width screen, so the tab bar draws itself (jsdom matches no media query by default).
    const before = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: true, media: q, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    render(<AppShell tabs={tabs()} />);
    window.matchMedia = before;
    // Once in the bar, once in the sidebar.
    expect(screen.getAllByText('Sell').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Stock').length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector('[data-ax-shell="app"] .ax-shell__side')).not.toBeNull();
    expect(document.querySelector('[data-ax-shell="app"] .ax-shell__bar')).not.toBeNull();
  });

  it('keeps the tab itself when nobody holds it, and says when it changes', () => {
    const seen: string[] = [];
    function Where() {
      return <output data-testid="where">{useAppShell().active}</output>;
    }
    render(
      <AppShell tabs={tabs()} onActiveChange={(id) => seen.push(id)}>
        <Where />
      </AppShell>,
    );
    expect(screen.getByTestId('where').textContent).toBe('sell');
    fireEvent.click(screen.getAllByText('Stock')[0]);
    expect(seen).toEqual(['stock']);
    expect(screen.getByTestId('where').textContent).toBe('stock');
  });

  it('follows `active` when the app holds it, and falls back when that tab goes', () => {
    function Where() {
      return <output data-testid="where">{useAppShell().active}</output>;
    }
    const { rerender } = render(
      <AppShell tabs={tabs()} active="stock">
        <Where />
      </AppShell>,
    );
    expect(screen.getByTestId('where').textContent).toBe('stock');
    rerender(
      <AppShell tabs={tabs().slice(0, 1)} active="stock">
        <Where />
      </AppShell>,
    );
    expect(screen.getByTestId('where').textContent).toBe('sell');
  });

  it('does not rebuild the stacks when the shell re-renders with the same tabs', () => {
    const { rerender } = render(<AppShell tabs={tabs()} />);
    rerender(<AppShell tabs={tabs()} logo={<b>Shop</b>} />);
    rerender(<AppShell tabs={tabs()} immersive />);
    expect(mounts.sell).toBe(1);
  });

  it('immersive: no tab bar and no sidebar, and the pages stay', () => {
    render(<AppShell tabs={tabs()} immersive />);
    expect(document.querySelector('.ax-shell__bar')).toBeNull();
    expect(document.querySelector('.ax-shell__side')).toBeNull();
    expect(document.querySelector('[data-ax-shell="app"]')?.getAttribute('data-immersive')).toBe('true');
    expect(screen.getByText('sell page')).toBeTruthy();
  });

  it('ships its CSS with the HTML: the breakpoint, the safe area, and the bar stepping aside while typing', () => {
    render(<AppShell id="shop" tabs={tabs()} breakpoint={720} />);
    const css = document.querySelector('style[data-ax-shell-style="shop"]')?.textContent ?? '';
    expect(css).toContain('@media (max-width:720px)');
    expect(css).toContain('safe-area-inset-bottom');
    expect(css).toContain(`html[data-ax-keyboard='open'] [data-ax-shell="shop"] .ax-shell__bar{display:none}`);
    expect(css).toContain('var(--ax-vv-height,100dvh)');
  });

  it('keyboardSafe={false}: plain full height, no keyboard rule', () => {
    render(<AppShell id="plain" tabs={tabs()} keyboardSafe={false} />);
    const css = document.querySelector('style[data-ax-shell-style="plain"]')?.textContent ?? '';
    expect(css).not.toContain('data-ax-keyboard');
    expect(css).not.toContain('--ax-vv-height');
  });

  it('tells what is reading the bar where it is, without re-rendering the shell', () => {
    function Pill() {
      const bar = useAppShellBar();
      return <output data-testid="bar">{bar ? (bar.hidden ? 'hidden' : `shown ${bar.height}`) : 'unknown'}</output>;
    }
    render(
      <AppShell tabs={tabs()}>
        <Pill />
      </AppShell>,
    );
    // jsdom matches no media query, so the bar is not drawn and says it is hidden.
    act(() => {});
    expect(screen.getByTestId('bar').textContent).toBe('hidden');
  });

  it('adds the app\'s classes to each part', () => {
    render(<AppShell tabs={tabs()} className="mine" classNames={{ stacks: 'pages', bar: 'tabbar' }} />);
    expect(document.querySelector('.ax-shell.mine')).not.toBeNull();
    expect(document.querySelector('.ax-shell__stacks.pages')).not.toBeNull();
    expect(document.querySelector('.ax-shell__bar.tabbar')).not.toBeNull();
  });
});

describe('outside a shell', () => {
  it('useAppShell says where it must be used', () => {
    function Lost() {
      useAppShell();
      return null;
    }
    expect(() => render(<Lost />)).toThrow(/inside <AppShell>/);
  });

  it('useAppShellBar is null', () => {
    function Pill() {
      return <output data-testid="bar">{String(useAppShellBar())}</output>;
    }
    render(<Pill />);
    expect(screen.getByTestId('bar').textContent).toBe('null');
  });
});
