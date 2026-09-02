/**
 * Reloading the page while a sheet is open.
 *
 * A fragment survives a reload — that is most of why overlay state lives there — so the app comes
 * back up with `#ax=…` naming a sheet that nothing has drawn yet. The library's promise is that the
 * URL and the screen end up agreeing, whichever way the consumer went:
 *
 *  - an overlay that CAN come back says so with `onRestore`, claims its name during mount, and
 *    keeps its entry: the shop is exactly where it left off;
 *  - an overlay that cannot is closed for it, automatically, because a URL naming a sheet nobody is
 *    showing costs a whole Back press — the shop pressing it twice to leave one page, which is
 *    precisely how a web app stops feeling like a real one.
 *
 * And under both, the entry log must not answer confidently: after a reload the log is empty while
 * the browser's entries are not, and those entries carry serials this document's counter is about
 * to hand out again.
 *
 * SIMULATED WITH A FRESH MODULE GRAPH, not a remount. `vi.resetModules()` plus a dynamic import
 * gives new module state — a new epoch, an empty log, no claims — while `window.history` and the
 * URL persist, which is exactly what a document reload is. A React unmount/remount is not: the
 * registry survives it, so the "reload" would be testing nothing. `autoDispose={false}` on the
 * outgoing render, because disposing a stack clears its slice of the URL, which is the opposite of
 * what a reload does.
 */
import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';

const A = () => <div>ROOT</div>;
const B = () => <div>B</div>;

async function settle(ms = 150) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/** Long enough for the two-frame settle plus its fallback timer. */
async function afterSettle() {
  await settle(500);
}

async function loadLibrary() {
  vi.resetModules();
  const mod = await import('../src/index');
  const hash = await import('../src/overlay/hash');
  const claims = await import('@academix-admin/overlay-route');
  const persistence = await import('../src/core/persistence');
  const registry = await import('../src/core/registry');
  const route = { useOverlayRoute: (await import('@academix-admin/overlay-route')).useOverlayRoute };
  return { NavigationStack: mod.default, ...hash, ...claims, ...persistence, ...registry, ...route };
}

type Lib = Awaited<ReturnType<typeof loadLibrary>>;

const Stack = (lib: Lib) => (
  <lib.NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory autoDispose={false} />
);

describe('a reload with an overlay named in the URL', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /** One page deep, with a sheet open over it. */
  async function upToASheet() {
    const lib = await loadLibrary();
    const view = render(Stack(lib));
    await settle();
    await act(async () => { await lib.getRegistry().get('s')!.api!.push('b'); });
    await settle();
    await act(async () => { lib.writeOverlayFragment('sheet:one', 'push'); });
    await settle();
    view.unmount();
    return lib;
  }

  it('puts a restorable sheet back, and keeps its entry', async () => {
    await upToASheet();

    const after = await loadLibrary();
    let reopened = false;

    /** A name that is the SAME on every load, which is what makes restoring possible at all. */
    function Sheet() {
      const [open, setOpen] = useState(false);
      after.useOverlayRoute('sheet:one', open, () => setOpen(false), {
        onRestore: () => {
          reopened = true;
          setOpen(true);
        },
      });
      return open ? <div>SHEET</div> : null;
    }

    const view = render(
      <>
        {Stack(after)}
        <Sheet />
      </>,
    );
    await afterSettle();

    expect(reopened, 'the sheet was told to come back').toBe(true);
    expect(view.queryByText('SHEET'), 'and it is on screen').toBeTruthy();
    expect(after.readOverlayFragment(), 'so its name stays in the URL').toBe('sheet:one');
    expect(
      after.isOverlayClaimed('sheet:one'),
      'and it is claimed, which is what kept the settle off it',
    ).toBe(true);
  });

  it('closes a sheet nothing puts back, without being asked', async () => {
    await upToASheet();

    const after = await loadLibrary();
    render(Stack(after));
    await afterSettle();

    expect(
      after.readOverlayFragment(),
      'no consumer claimed it, so the URL stops claiming it too',
    ).toBeNull();
    expect(
      after.getRegistry().get('s')!.api!.length(),
      'and the page underneath is untouched',
    ).toBe(2);
  });

  it('declines to guess a delta, rather than guessing from a stale serial', async () => {
    await upToASheet();

    const after = await loadLibrary();
    render(Stack(after));
    await settle();

    /*
     * The entry we come back on carries a serial the browser kept, and this document's counter has
     * already begun issuing the same numbers. Without the epoch, the log would match one of its own
     * records to an entry that merely shares a number — and answer with confidence.
     */
    expect(
      after.currentSerial(),
      'an entry numbered by the previous load is not this load’s to identify',
    ).toBeNull();
    expect(
      after.findBackDeltaForDepth('s', 1),
      'so the delta lookup declines, and the caller counts instead',
    ).toBeNull();
  });

  it('says out loud when a pop could not be justified by the log', async () => {
    /*
     * THE SILENCE WAS THE PROBLEM, not the fallback.
     *
     * Falling back to counting is correct when the log cannot answer — a delta it cannot justify is
     * worse than one that is sometimes short. What was wrong is that it happened without a word, so
     * two writers that stopped declaring their entries disabled this mechanism across a whole app
     * for weeks, and everything looked fine until an interleaving put the shop on another tab.
     *
     * Simulated by wiping the log, which is precisely what an undeclared write does to it: the log
     * can no longer find where it is standing. Not by reloading — a reload heals itself, because
     * mounting a stack writes an entry and re-seeds the log's footing. That healing is worth
     * knowing about too, and is why the first version of this test could not make the counter move.
     */
    const lib = await loadLibrary();
    render(Stack(lib));
    await settle();

    const api = lib.getRegistry().get('s')!.api!;
    await act(async () => { await api.push('b'); });
    await settle();
    await act(async () => { await api.push('a'); });
    await settle();

    await act(async () => { await api.pop(); });
    await settle(200);
    expect(
      lib.getPopHealth().namedByLog,
      'an ordinary pop is answered by the log, and says so',
    ).toBeGreaterThan(0);

    // Now the defect: something wrote an entry without telling the log.
    lib.resetEntryLog();
    expect(lib.getPopHealth().logKnowsWhereItIs, 'the log has lost its place').toBe(false);

    await act(async () => { await api.pop(); });
    await settle(200);

    const health = lib.getPopHealth();
    expect(
      health.fellBackToCounting,
      'and the fallback is counted rather than silent',
    ).toBeGreaterThan(0);
    expect(
      health.lastFallback?.knewPosition,
      'with the reason attached: it did not know where it was standing',
    ).toBe(false);
  });

  it('comes back on the page it was left on, and can still pop off it', async () => {
    const first = await loadLibrary();
    const view = render(Stack(first));
    await settle();
    await act(async () => { await first.getRegistry().get('s')!.api!.push('b'); });
    await settle();
    view.unmount();

    const after = await loadLibrary();
    render(Stack(after));
    await settle(250);

    const api = after.getRegistry().get('s')!.api!;
    expect(api.length(), 'the reload came back on the pushed page').toBe(2);

    await act(async () => { await api.pop(); });
    await settle(250);

    expect(api.length(), 'and the pop still works').toBe(1);
    const nav = new URL(window.location.href).searchParams.get('nav');
    expect(
      nav === null || !/s:1\.a1\./.test(nav),
      `the URL must agree that we are back at the root, got ${nav}`,
    ).toBe(true);
  });

  it('settles once, however many stacks are mounted', async () => {
    await upToASheet();

    const after = await loadLibrary();
    const Two = () => (
      <>
        <after.NavigationStack id="s" navLink={{ a: A, b: B }} entry="a" syncHistory autoDispose={false} />
        <after.NavigationStack id="t" navLink={{ a: A, b: B }} entry="a" syncHistory autoDispose={false} />
      </>
    );
    render(<Two />);
    await afterSettle();

    expect(after.readOverlayFragment(), 'settled').toBeNull();
    expect(
      after.getRegistry().get('s')!.api!.length(),
      'and a second stack asking for the same settle did not step back twice',
    ).toBe(2);
  });

  it('does nothing on an ordinary boot', async () => {
    const lib = await loadLibrary();
    render(Stack(lib));
    await afterSettle();

    expect(
      lib.closeUnrestoredOverlay(),
      'an app that boots with no sheet named must see a no-op',
    ).toBe(false);
  });
});
