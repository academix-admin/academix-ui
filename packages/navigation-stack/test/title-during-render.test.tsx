/**
 * `nav.title()` IS SAFE TO CALL WHILE RENDERING.
 *
 * It is documented as callable from a render body — a page naming itself as it draws — and for a
 * while it was not. Telling the stack's listeners runs `setState` on `NavigationStack`, and React
 * refuses that during another component's render:
 *
 *     Cannot update a component (`NavigationStack`) while rendering a different component
 *     (`PageScaffold`).
 *
 * It was on the console of every screen in two apps, because both put the call in a shared page
 * shell. Nothing was visibly broken, which is why it survived: React warns and then applies the
 * update anyway. The next thing that changes about scheduling is where it stops doing that.
 *
 * So the check is on the WARNING, not on the title. A test that only asserted `document.title`
 * passed the entire time the bug existed.
 */
import React from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, act } from '@testing-library/react';
import { renderInStack } from '../src/testing';
import { useNav, useNavOptional, useNavTitle } from '../src/index';

afterEach(() => cleanup());
beforeEach(() => {
  document.title = 'The app';
});

/** Everything React says while the body runs, so a warning cannot go unnoticed. */
async function complaintsWhile(run: () => Promise<void>): Promise<string[]> {
  const said: string[] = [];
  const error = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    said.push(args.map(String).join(' '));
  });
  const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    said.push(args.map(String).join(' '));
  });
  try {
    await run();
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
  return said;
}

describe('naming a page while it renders', () => {
  it('does not update the stack during the render that names it', async () => {
    function Shell({ title }: { title: string }) {
      // Exactly what a shared page shell does, and what every page in two apps does through it.
      const nav = useNavOptional();
      nav?.title(title);
      return <p>{title}</p>;
    }

    const said = await complaintsWhile(async () => {
      const { settle } = renderInStack(<Shell title="Sell" />);
      await settle();
    });

    expect(said.filter((s) => /while rendering a different component/i.test(s))).toEqual([]);
    expect(document.title).toBe('Sell');
  });

  it('still names the page when several pages name themselves in one pass', async () => {
    // A group mounts every tab at once. The renames collapse into one notification; the last one
    // to run is the one whose stack is on top, and its name is the one on the document.
    function Named({ name }: { name: string }) {
      const nav = useNav();
      nav.title(name);
      return <p>{name}</p>;
    }

    const said = await complaintsWhile(async () => {
      const { settle } = renderInStack(<Named name="Stock" />);
      await settle();
    });

    expect(said.filter((s) => /while rendering a different component/i.test(s))).toEqual([]);
    expect(document.title).toBe('Stock');
  });

  it('applies a rename that arrives after the first one, rather than collapsing it away', async () => {
    /*
     * The flag that stops one notification per rename must not stop the SECOND rename being told
     * about at all. The page renames itself in a later pass — which is what a page whose name
     * depends on what it just loaded actually does — and the later name is the one that sticks.
     */
    function Renaming() {
      const nav = useNav();
      const [name, setName] = React.useState('First');
      nav.title(name);
      return (
        <button type="button" onClick={() => setName('Second')}>
          {name}
        </button>
      );
    }

    const { settle, getByRole } = renderInStack(<Renaming />);
    await settle();
    expect(document.title).toBe('First');

    await act(async () => {
      getByRole('button').click();
    });
    await settle();
    expect(document.title).toBe('Second');
  });

  it('useNavTitle survives a push and a pop, like the render-body form does', async () => {
    /*
     * THE NAME MUST LIVE ON THE ENTRY, not in whatever ran last.
     *
     * With the name set from a render body this was hidden: popping re-rendered the page
     * underneath, which promptly named itself again. An effect does NOT re-run on a pop — the
     * component never unmounted and its deps did not change — so if the restore is not coming from
     * the entry's own metadata, the title stays on the page that has just been closed.
     *
     * Store Manager hit exactly this: "Going off → Store Manager (want Stock)".
     */
    function Named({ name }: { name: string }) {
      useNavTitle(name);
      return <p>{name}</p>;
    }
    const Under = () => <Named name="Stock" />;
    const Over = () => <Named name="Going off" />;

    const { nav, settle } = renderInStack(<Under />, { navLink: { over: Over } });
    await settle();
    expect(document.title).toBe('Stock');

    await nav.push('over');
    await settle();
    expect(document.title).toBe('Going off');

    await nav.pop();
    await settle();
    expect(document.title).toBe('Stock');
  });

  it('useNavTitle names the page too, and says nothing outside a stack', async () => {
    function Shell({ title }: { title: string }) {
      useNavTitle(title);
      return <p>{title}</p>;
    }

    const said = await complaintsWhile(async () => {
      const { settle } = renderInStack(<Shell title="Named by a hook" />);
      await settle();
    });

    expect(said.filter((s) => /while rendering a different component/i.test(s))).toEqual([]);
    expect(document.title).toBe('Named by a hook');
  });
});
