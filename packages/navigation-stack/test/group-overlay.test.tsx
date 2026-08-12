/**
 * Step 2 — group-scoped overlay layer.
 *
 * The point of this layer is that it is NOT owned by a tab. The per-tab containers are
 * display:none'd on switch, so an overlay hosted in one would vanish or resurface in the wrong
 * tab. These tests assert the two properties that matter: it renders above the tabs, and it
 * survives a tab switch.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { GroupNavigationStack, getGroupOverlay } from '../src/components';

const GROUP = 'g1';

function Group({ current }: { current: string }) {
  const stacks = new Map<string, React.ReactElement>([
    ['tabA', <div key="a">TAB A CONTENT</div>],
    ['tabB', <div key="b">TAB B CONTENT</div>],
  ]);
  return <GroupNavigationStack id={GROUP} navStack={stacks} current={current} preloadAll />;
}

describe('group overlay layer', () => {
  beforeEach(() => {
    getGroupOverlay(GROUP).clear();
  });
  afterEach(() => {
    getGroupOverlay(GROUP).clear();
    cleanup();
  });

  it('renders nothing when no overlay is registered', () => {
    render(<Group current="tabA" />);
    expect(document.querySelector('[data-ax-group-overlay]')).toBeNull();
  });

  it('renders an inserted overlay above the tabs', async () => {
    render(<Group current="tabA" />);

    await act(async () => {
      getGroupOverlay(GROUP).insert(() => <div>SHEET</div>, { id: 'sheet' });
    });

    expect(screen.getByText('SHEET')).toBeTruthy();
    expect(document.querySelector('[data-ax-group-overlay="sheet"]')).toBeTruthy();
  });

  it('SURVIVES a tab switch (the reason this layer exists)', async () => {
    const { rerender } = render(<Group current="tabA" />);

    await act(async () => {
      getGroupOverlay(GROUP).insert(() => <div>SHEET</div>, { id: 'sheet' });
    });
    expect(screen.getByText('SHEET')).toBeTruthy();

    // Switch tabs — a stack-scoped overlay would be unmounted/hidden here.
    await act(async () => {
      rerender(<Group current="tabB" />);
    });

    expect(screen.getByText('SHEET')).toBeTruthy();
  });

  it('removes on request and via the returned handle', async () => {
    render(<Group current="tabA" />);

    let handle: { remove: () => void } | undefined;
    await act(async () => {
      handle = getGroupOverlay(GROUP).insert(() => <div>ONE</div>, { id: 'one' });
      getGroupOverlay(GROUP).insert(() => <div>TWO</div>, { id: 'two' });
    });
    expect(getGroupOverlay(GROUP).list()).toEqual(['one', 'two']);

    await act(async () => { handle!.remove(); });
    expect(screen.queryByText('ONE')).toBeNull();
    expect(screen.getByText('TWO')).toBeTruthy();

    await act(async () => { getGroupOverlay(GROUP).remove('two'); });
    expect(screen.queryByText('TWO')).toBeNull();
  });

  it('is scoped per group id, so two groups do not leak into each other', async () => {
    render(<Group current="tabA" />);
    await act(async () => {
      getGroupOverlay(GROUP).insert(() => <div>MINE</div>, { id: 'x' });
      getGroupOverlay('other-group').insert(() => <div>THEIRS</div>, { id: 'x' });
    });

    expect(screen.getByText('MINE')).toBeTruthy();
    expect(screen.queryByText('THEIRS')).toBeNull(); // not hosted by this group
    getGroupOverlay('other-group').clear();
  });

  it('does not swallow taps meant for the app underneath', async () => {
    render(<Group current="tabA" />);
    await act(async () => {
      getGroupOverlay(GROUP).insert(() => <div>SHEET</div>, { id: 'sheet' });
    });

    const wrapper = document.querySelector('[data-ax-group-overlay="sheet"]') as HTMLElement;
    // The full-screen wrapper must not intercept pointer events; only its content does.
    expect(wrapper.style.pointerEvents).toBe('none');
    expect(wrapper.style.position).toBe('fixed');
  });
});
