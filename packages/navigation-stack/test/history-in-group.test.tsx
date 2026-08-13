/**
 * Reproduces academix-web's real shape: a NavigationStack with syncHistory rendered INSIDE a
 * GroupNavigationStack. The unit tests for push/consume exercised persistence.ts directly, which
 * proved the bookkeeping but not that the group path actually reaches it.
 *
 * Reported live: Back leaves the site instead of popping, and after a swipe-back from B to A, B
 * comes back.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup, screen } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack } from '../src/index';
import { getRegistry } from '../src/core/registry';

const A = () => <div>PAGE A</div>;
const B = () => <div>PAGE B</div>;

function Inner() {
  return (
    <NavigationStack
      id="quiz"
      navLink={{ a: A, b: B }}
      entry="a"
      syncHistory
      persist
    />
  );
}

function Grouped() {
  const stacks = new Map<string, React.ReactElement>([['quiz', <Inner key="q" />]]);
  return <GroupNavigationStack id="maingroup" navStack={stacks} current="quiz" persist />;
}

describe('history push inside a GroupNavigationStack (real academix-web shape)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/main');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a history entry when pushing a page', async () => {
    render(<Grouped />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(screen.getByText('PAGE A')).toBeTruthy();

    const push = vi.spyOn(window.history, 'pushState');

    const api = getRegistry().get('quiz')?.api;
    expect(api, 'stack api should be registered').toBeTruthy();

    await act(async () => {
      await api!.push('b');
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByText('PAGE B')).toBeTruthy();
    // THE ASSERTION THAT MATTERS: without an entry, Back leaves the site.
    expect(push, 'pushState must be called so Back has something to pop').toHaveBeenCalled();
  });

  it('puts the pushed path in the URL', async () => {
    render(<Grouped />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const api = getRegistry().get('quiz')?.api;
    await act(async () => {
      await api!.push('b');
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(new URL(window.location.href).searchParams.get('nav')).toContain('b');
  });
  // Asserts the STACK, not the DOM.
  //
  // This was previously marked it.fails as a "persist pop-leak", on the strength of the popped
  // page still being in the DOM here. That diagnosis was wrong. jsdom has no CSS transitions, so
  // the exiting page sits in `nav-fade-exit-active` forever and never unmounts:
  //
  //   <div class="navstack-page nav-fade-exit nav-fade-exit-active" data-nav-uid="...">PAGE B</div>
  //
  // A real browser removes it — verified in academix-web's Playwright suite, which counts
  // [data-nav-uid] elements after a pop and finds exactly one. The DOM half of this invariant
  // therefore belongs in E2E, where transitions actually run; asserting it in jsdom measures the
  // absence of an animation engine, not a leak.
  it('POP removes the entry from the stack (DOM unmount is covered in E2E)', async () => {
    render(<Grouped />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const api = getRegistry().get('quiz')?.api;
    await act(async () => {
      await api!.push('b');
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByText('PAGE B')).toBeTruthy();

    // What swipe-back does.
    await act(async () => {
      await api!.pop();
      // Must exceed DEFAULT_TRANSITION_DURATION (220ms): the popped page stays mounted while its
      // exit transition runs, so asserting sooner measures the animation, not a leak.
      await new Promise((r) => setTimeout(r, 400));
    });

    expect(api!.length(), 'stack should be back to one entry').toBe(1);
    expect(api!.peek()?.key, 'root should be on top again').toBe('a');
  });

  it('persisted storage reflects the POP, not the pre-pop stack', async () => {
    render(<Grouped />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const api = getRegistry().get('quiz')?.api;
    await act(async () => {
      await api!.push('b');
      await new Promise((r) => setTimeout(r, 50));
      await api!.pop();
      // Must exceed DEFAULT_TRANSITION_DURATION (220ms): the popped page stays mounted while its
      // exit transition runs, so asserting sooner measures the animation, not a leak.
      await new Promise((r) => setTimeout(r, 400));
    });

    const persisted = JSON.stringify(Object.entries(sessionStorage));
    expect(persisted, 'sessionStorage still lists the popped page -> a remount would restore it')
      .not.toContain('"b"');
  });
});

describe('isActiveStack honours the syncHistory PROP, not just the imperative flag', () => {
  // Regression for the bug that made browser Back do nothing: the popstate handler bails on
  // `if (!api.isActiveStack()) return`, and isActiveStack only consulted regEntry.historySyncEnabled
  // — which the `syncHistory` prop never sets. Prop-configured stacks (i.e. nearly all of them)
  // therefore ignored every popstate, so Back changed the URL and left the stack untouched.
  it('is true for a stack configured via the prop alone', async () => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/main');
    render(<Grouped />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const reg = getRegistry().get('quiz');
    expect(reg, 'stack should be registered').toBeTruthy();
    // The prop is set; the imperative flag deliberately is NOT.
    expect(reg!.historySyncEnabled).toBe(false);
    expect(reg!.api!.isActiveStack(), 'prop-configured stack must count as active').toBe(true);
  });
});
