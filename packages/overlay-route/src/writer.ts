/**
 * How this package writes history, and how a navigation library can take that over.
 *
 * ## The problem this seam exists for
 *
 * An overlay's entry is a real history entry. A navigation library that pops pages by asking
 * `history.go(-n)` has to COUNT that entry, because `go` counts positions in the browser's single
 * global list — and a library keeping a ledger of the entries it wrote will not have this one in
 * it. Measured, in an app using both: opening one picker anywhere in a journey left every later pop
 * short by one, so a Back press landed on another tab's page with the picker's own fragment
 * restored into the URL.
 *
 * ## Why it is a seam and not a dependency
 *
 * Neither side should have to know the other exists. A sheet package that depended on a navigation
 * package would drag a router into every app that only wanted a bottom sheet; a navigation package
 * that knew about sheets would be guessing at somebody else's UI. So they meet HERE, at a contract
 * small enough to state in one line: "something else may own the history writing".
 *
 * A navigation library calls {@link setHistoryWriter} once, on import. This package then routes its
 * writes through it and the entries land in that library's ledger. Nothing registers? The default
 * below writes them itself, and everything in this package still works — the back gesture closes
 * the sheet, the fragment survives a reload — it simply has no ledger to join.
 *
 * That is the whole integration. It is deliberately one function, because a wide contract between
 * two independent packages is a dependency wearing a disguise.
 */

export interface OverlayHistoryWrite {
  mode: 'push' | 'replace';
  /** Absolute href to write. Already built by the caller; nothing here is inferred. */
  href: string;
  /** State to put on the entry. A replace merges it; a push does not (see below). */
  state: Record<string, unknown>;
}

export type OverlayHistoryWriter = (write: OverlayHistoryWrite) => void;

/**
 * What this package does on its own: write the entry, and nothing more.
 *
 * A PUSH does not inherit the previous entry's state. The browser gives a real navigation a fresh
 * null state, and copying the old one forward makes every other consumer's marker look as though it
 * belongs to the new entry too — a sheet that had written its own id before a page was pushed saw
 * that id on the pushed entry, decided the entry was its own, and called `history.back()` as it
 * closed, silently discarding the page that had just been pushed. A REPLACE does merge, and must:
 * that is the same entry, so somebody else's state on it is still theirs.
 */
const defaultWriter: OverlayHistoryWriter = ({ mode, href, state }) => {
  if (typeof window === 'undefined') return;
  if (mode === 'push') {
    window.history.pushState({ ...state }, '', href);
  } else {
    window.history.replaceState({ ...(window.history.state ?? {}), ...state }, '', href);
  }
};

let _writer: OverlayHistoryWriter = defaultWriter;

/**
 * Hand history writing to something that keeps a ledger — a navigation library, typically, called
 * once when it loads. Returns a function that puts the default back, for tests and teardown.
 */
export function setHistoryWriter(writer: OverlayHistoryWriter): () => void {
  const previous = _writer;
  _writer = writer;
  return () => {
    _writer = previous;
  };
}

/** Whether something has taken over. Useful in devtools; never branch behaviour on it. */
export function hasExternalHistoryWriter(): boolean {
  return _writer !== defaultWriter;
}

export function writeOverlayHistory(write: OverlayHistoryWrite): void {
  _writer(write);
}
