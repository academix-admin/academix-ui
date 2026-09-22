/**
 * "Is my tab the one on screen?" — the question `api.isActiveStack()` does not answer.
 *
 * That one reports whether the stack syncs history, which is true of every tab in a group at once.
 * A page reading it as "I am showing" acts over whatever the person is actually looking at: the
 * store-manager till pushed its count screen onto the Money tab during start-up, and the entry it
 * added then swallowed a Back press.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, screen } from '@testing-library/react';
import NavigationStack, { GroupNavigationStack, useIsActiveStack } from '../src/index';
import { getRegistry } from '../src/core/registry';

function Watcher({ label }: { label: string }) {
  const active = useIsActiveStack();
  return <div data-testid={label}>{active ? 'showing' : 'hidden'}</div>;
}

const First = () => <Watcher label="first" />;
const Second = () => <Watcher label="second" />;

async function settle(ms = 250) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe('useIsActiveStack', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/app');
  });
  afterEach(() => cleanup());

  it('is true for the tab on screen and false for the others', async () => {
    const stacks = new Map<string, React.ReactElement>([
      ['one', <NavigationStack key="1" id="one" navLink={{ home: First }} entry="home" syncHistory />],
      ['two', <NavigationStack key="2" id="two" navLink={{ home: Second }} entry="home" syncHistory />],
    ]);
    render(<GroupNavigationStack id="tabs" navStack={stacks} current="one" preloadAll />);
    await settle(400);

    expect(screen.getByTestId('first').textContent, 'the tab we started on').toBe('showing');
    expect(screen.queryByTestId('second')?.textContent ?? 'hidden', 'the other one').toBe('hidden');
  });

  it('is true outside a group, where there is only one stack', async () => {
    render(<NavigationStack id="alone" navLink={{ home: First }} entry="home" />);
    await settle();
    expect(screen.getByTestId('first').textContent).toBe('showing');
  });
});
