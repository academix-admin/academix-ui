/**
 * ONE TAB DRAWN AFTER HYDRATION, whatever the URL says (1.13.1).
 *
 * The server cannot read `?group=`, so it draws `current`. The client used to draw the URL's tab in its
 * hydration render; React does not repair attributes on hydration, so the server's "active" stayed on
 * the first tab and two tabs were drawn at once (JIMSteps opened on `?group=me-stack`, 13 Nov).
 */
import React, { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { GroupNavigationStack } from '../src/index';

const tabs = () =>
  new Map<string, React.ReactElement>([
    ['play', <p key="play">Play page</p>],
    ['me', <p key="me">Me page</p>],
  ]);

const drawn = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.group-stack-container')]
    .filter((c) => c.style.display !== 'none')
    .map((c) => c.getAttribute('data-stack-id'));

const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

afterEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
  sessionStorage.clear();
});

describe('GroupNavigationStack and hydration', () => {
  it('hydrates on the server\'s tab, then moves to the URL\'s — one tab drawn', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<GroupNavigationStack id="g" navStack={tabs()} current="play" />);
    document.body.appendChild(container);
    expect(drawn(container)).toEqual(['play']);

    window.history.replaceState(null, '', '/?group=me');
    const seen: string[] = [];
    await act(async () => {
      hydrateRoot(container, <GroupNavigationStack id="g" navStack={tabs()} current="play" onCurrentChange={(id) => seen.push(id)} />);
    });
    await wait(120);
    expect(drawn(container)).toEqual(['me']);
    expect(seen).toContain('me');
  });

  it('a tab mounted for hydration that restamps the URL does not keep the group on it', async () => {
    // JIMSteps' Play pushes its warm-up on mount, which writes `?group=play` — before the group's
    // own mount effect ran, which then read the URL and stayed on Play.
    function Pushy() {
      React.useEffect(() => {
        window.history.replaceState(null, '', '/?group=play');
      }, []);
      return <p>Play page</p>;
    }
    const pushyTabs = () => new Map<string, React.ReactElement>([['play', <Pushy key="play" />], ['me', <p key="me">Me page</p>]]);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<GroupNavigationStack id="g3" navStack={pushyTabs()} current="play" />);
    document.body.appendChild(container);
    window.history.replaceState(null, '', '/?group=me');
    await act(async () => {
      hydrateRoot(container, <GroupNavigationStack id="g3" navStack={pushyTabs()} current="play" />);
    });
    await wait(120);
    expect(drawn(container)).toEqual(['me']);
  });

  it('mounted in the browser alone, it opens on the URL\'s tab', async () => {
    window.history.replaceState(null, '', '/?group=me');
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(<GroupNavigationStack id="g2" navStack={tabs()} current="play" />);
    });
    await wait(120);
    expect(drawn(container)).toEqual(['me']);
  });
});
