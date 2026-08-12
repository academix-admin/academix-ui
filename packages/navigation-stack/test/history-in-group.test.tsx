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
    />
  );
}

function Grouped() {
  const stacks = new Map<string, React.ReactElement>([['quiz', <Inner key="q" />]]);
  return <GroupNavigationStack id="maingroup" navStack={stacks} current="quiz" />;
}

describe('history push inside a GroupNavigationStack (real academix-web shape)', () => {
  beforeEach(() => {
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
});
