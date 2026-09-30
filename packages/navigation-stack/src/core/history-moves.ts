/**
 * WHAT THE BROWSER IS DOING TO US, AS OPPOSED TO WHAT WE ASKED IT TO DO.
 *
 * A popstate arrives for two very different reasons, and they used to be handled as one:
 *
 *  1. THE PERSON MOVED — the phone's Back, iOS's edge-swipe, the browser's buttons. The entry the
 *     browser restored is the truth, and every stack rebuilds from it.
 *
 *  2. WE MOVED — a pop already changed the stack, then handed its history entries back with
 *     `history.go(-n)`. That call is asynchronous: the stack is right immediately, and the browser
 *     catches up a moment later. The entry it lands on is supposed to agree with the stack, and
 *     when it does not (a lost entry log, a second writer, a tab switch restamping it), the stack
 *     is still the truth — the person pressed Back on THIS page, in THIS tab.
 *
 * Treating (2) as (1) is how a Back pressed on Stock arrived on Sell: the entry the pop landed on
 * had last been stamped by Sell, and the tab group obeyed it. And how a page pushed straight after
 * a pop vanished: the pop's move landed after the push and "restored" the stack to before it.
 *
 * The second half of this file answers the question a popstate never carries: which WAY did the
 * person move? Every entry this library writes records its position, so an arrival can be compared
 * with where we were standing.
 */
import { readAxState } from './persistence';

// ── Our own moves ────────────────────────────────────────────────────────────────────

type OwnMove = {
  stackId: string;
  arrive: () => void;
  timer: ReturnType<typeof setTimeout>;
  waiters: Array<() => void>;
};

let _ownMove: OwnMove | null = null;

/**
 * How long to wait for the browser to deliver a move we asked for. A `go` the browser declines
 * (nothing that far back) never arrives, and nothing may wait on it forever.
 */
const OWN_MOVE_TIMEOUT_MS = 1000;

function endOwnMove(move: OwnMove) {
  if (_ownMove !== move) return;
  _ownMove = null;
  if (typeof window !== 'undefined') window.removeEventListener('popstate', move.arrive);
  clearTimeout(move.timer);
  move.waiters.splice(0).forEach((w) => {
    try { w(); } catch { /* a waiter's failure is its own */ }
  });
}

/**
 * Called immediately before this library calls `history.go(-n)` for `stackId`.
 *
 * The move stays "ours" for the WHOLE dispatch of the popstate it produces — every listener, in
 * whatever order they were registered, sees the same answer — and ends on the next task.
 */
export function markOwnMove(stackId: string): void {
  if (typeof window === 'undefined') return;
  if (_ownMove) endOwnMove(_ownMove);

  const move: OwnMove = {
    stackId,
    arrive: () => {
      window.removeEventListener('popstate', move.arrive);
      setTimeout(() => endOwnMove(move), 0);
    },
    timer: setTimeout(() => endOwnMove(move), OWN_MOVE_TIMEOUT_MS),
    waiters: [],
  };
  _ownMove = move;
  window.addEventListener('popstate', move.arrive);
}

/** The stack whose own `history.go` is being delivered right now, or null for a person's move. */
export function ownMoveInFlight(): string | null {
  return _ownMove?.stackId ?? null;
}

/**
 * Resolves once no move of ours is still on its way.
 *
 * A navigation that WRITES history must not run while one is: the push would be written, and then
 * the late move would carry the browser — and, before this, the stack — back past it.
 */
export function ownMoveSettled(): Promise<void> {
  const move = _ownMove;
  if (!move) return Promise.resolve();
  return new Promise((resolve) => move.waiters.push(resolve));
}

/** For tests: forget a move that a torn-down environment will never deliver. */
export function resetOwnMove(): void {
  if (_ownMove) endOwnMove(_ownMove);
}

// ── Which way the person moved ───────────────────────────────────────────────────────

/**
 * The position (in the browser's list) of the entry we are standing on, as far as our own writes
 * can tell. A push is one further than where it was written; a replace is the same place.
 */
let _standingIndex: number | null = null;

function indexOfState(state: unknown): number | null {
  const ax = readAxState(state) as { axIndex?: unknown } | null;
  return ax && typeof ax.axIndex === 'number' ? ax.axIndex : null;
}

/** Where we stand now: the current entry's own index, or 0 for an entry that predates us. */
export function standingIndex(): number {
  if (_standingIndex !== null) return _standingIndex;
  if (typeof window === 'undefined') return 0;
  _standingIndex = indexOfState(window.history.state) ?? 0;
  return _standingIndex;
}

/** The index to stamp on an entry about to be written. */
export function indexForWrite(mode: 'push' | 'replace'): number {
  const here = standingIndex();
  return mode === 'push' ? here + 1 : here;
}

/** Called by the writer once an entry is written. */
export function noteWrittenIndex(index: number): void {
  _standingIndex = index;
}

export type MoveDirection = 'back' | 'forward';

const _directions = new WeakMap<Event, MoveDirection>();

/**
 * Which way this popstate moved, answered the same for every listener that asks.
 *
 * An entry without a position is one this library did not write — the page's first entry, in
 * practice — and nothing we wrote can sit behind it, so arriving there is always Back.
 */
export function directionOf(event: PopStateEvent): MoveDirection {
  const known = _directions.get(event);
  if (known) return known;
  const from = standingIndex();
  const to = indexOfState(event.state);
  const direction: MoveDirection = to === null || to < from ? 'back' : to > from ? 'forward' : 'back';
  _directions.set(event, direction);
  _standingIndex = to ?? 0;
  return direction;
}

/*
 * Every popstate moves where we stand, whether or not anybody asks which way it went — otherwise
 * the next question would be answered from a position two moves out of date.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => { directionOf(e); }, true);
}

// ── A Back a tab kept for itself ─────────────────────────────────────────────────────

const _keptInTab = new WeakSet<Event>();

/** A stack answered this Back by popping its own page; the tab group must not change tab for it. */
export function markKeptInTab(event: Event): void {
  _keptInTab.add(event);
}

export function wasKeptInTab(event: Event): boolean {
  return _keptInTab.has(event);
}
