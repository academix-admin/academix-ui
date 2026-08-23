import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@academix-admin/modal-sheet";
import {
  type ErrorProps,
  type LayoutProps,
  type LoadingProps,
  type NoResultProps,
  type QueryResult,
  type SearchProps,
  type SearchResult,
  type SearchState,
  SearchBar,
  SearchTextContext,
  SearchViewerAggregateContext,
  computeAggregateState,
  createExecuteSearch,
  getSearchViewerStyles,
  paddingStr,
  useInjectStyles,
  useKeyboardHeight,
  useModalKeys,
  useSearchInput,
} from "./core";

// ==================== Types ====================

export type SearchViewerProps<T = any, C = any> = {
  id?: string;
  isOpen: boolean;
  backDrop?: boolean;
  onClose: () => void;
  searchProp?: SearchProps;
  loadingProp?: LoadingProps;
  noResultProp?: NoResultProps;
  errorProp?: ErrorProps;
  layoutProp?: LayoutProps;
  childrenDirection?: "vertical" | "horizontal";
  children?: React.ReactNode;
  unmountOnClose?: boolean;
  zIndex?: number;
  /**
   * Accessible name for the sheet, announced when it opens.
   *
   * A modal with no name is announced simply as "dialog", which tells a screen-reader user that
   * something has taken over the screen and nothing at all about what.
   */
  ariaLabel?: string;
  maxHeight?: string;
  minHeight?: string;
  searchState?: SearchState;
  onInitialData?: (text: string) => T[];
  localDataDeps?: React.DependencyList;
  queryData?: (
    cursor: C | undefined,
    text: string,
    signal?: AbortSignal
  ) => Promise<QueryResult<T, C>>;
  onResult?: (results: SearchResult<T>[]) => void;
  onRemoveDuplicateBy?: (item: T) => any;
  debounceMs?: number;
  /** Don't call `queryData` until the trimmed query is at least this long. Default 0 (search always,
   *  including the empty query). Set e.g. 1–2 to avoid empty/one-char server round-trips. */
  minQueryLength?: number;
  /** Run the initial query as soon as the sheet opens (even with no `onInitialData`) so a server-only
   *  viewer shows results immediately instead of a blank sheet. Default false. */
  searchOnOpen?: boolean;
};

// ==================== SearchViewer ====================

function SearchViewer<T = any, C = any>({
  id: providedId,
  isOpen,
  backDrop = true,
  onClose,
  searchProp,
  loadingProp,
  noResultProp,
  errorProp,
  layoutProp,
  childrenDirection = "vertical",
  children,
  unmountOnClose = true,
  zIndex = 1000,
  ariaLabel,
  maxHeight = "90dvh",
  searchState: externalSearchState = "initial",
  onInitialData,
  localDataDeps,
  queryData,
  onResult,
  onRemoveDuplicateBy,
  debounceMs = 300,
  minQueryLength = 0,
  searchOnOpen = false,
}: SearchViewerProps<T, C>) {
  const [id] = useState(
    () => providedId || `search-${Math.random().toString(36).substring(2, 11)}`
  );
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [cursor, setCursor] = useState<C | undefined>(undefined);
  const [internalSearchState, setInternalSearchState] =
    useState<SearchState>(externalSearchState);

  const isPaginating = useRef(false);
  const sheetRef = useRef<any>(null);
  const searchAbortRef = useRef<AbortController | undefined>(undefined);
  const paginationAbortRef = useRef<AbortController | undefined>(undefined);
  const cacheRef = useRef<Map<string, QueryResult<T, C>>>(new Map());
  const onResultRef = useRef(onResult);
  const onInitialDataRef = useRef(onInitialData);
  const queryDataRef = useRef(queryData);
  const onRemoveDuplicateByRef = useRef(onRemoveDuplicateBy);

  onResultRef.current = onResult;
  onInitialDataRef.current = onInitialData;
  queryDataRef.current = queryData;
  onRemoveDuplicateByRef.current = onRemoveDuplicateBy;

  useInjectStyles(id, "search-viewer-styles", getSearchViewerStyles);
  const keyboardHeight = useKeyboardHeight();
  // Escape closes the viewer and Tab stays inside it — see useModalKeys.
  useModalKeys(isOpen, onClose, id);

  // Descendant sections (a Column, or anything else) can report a cumulative state up through this —
  // starts empty, so a plain SearchViewer with no Row/Column children behaves exactly as before.
  const [reportedStates, setReportedStates] = useState<Map<string, SearchState>>(new Map());
  const reportAggregate = useCallback((reporterId: string, state: SearchState) => {
    setReportedStates((prev) => {
      const next = new Map(prev);
      next.set(reporterId, state);
      return next;
    });
  }, []);
  const unreportAggregate = useCallback((reporterId: string) => {
    setReportedStates((prev) => {
      if (!prev.has(reporterId)) return prev;
      const next = new Map(prev);
      next.delete(reporterId);
      return next;
    });
  }, []);
  const aggregateReporterValue = useMemo(
    () => ({ report: reportAggregate, unreport: unreportAggregate }),
    [reportAggregate, unreportAggregate]
  );
  const reportedAggregate =
    reportedStates.size > 0 ? computeAggregateState(Array.from(reportedStates.values())) : null;

  // Precedence: an explicit `searchState` prop always wins (matches today's exact behaviour for any
  // consumer not using Row/Column) -> then a reported Column aggregate, if one exists -> then the
  // built-in single-query state machine below (for plain SearchViewer usage with queryData directly).
  const searchState =
    externalSearchState !== "initial"
      ? externalSearchState
      : reportedAggregate ?? internalSearchState;

  const removeDuplicates = useCallback(
    (items: SearchResult<T>[]): SearchResult<T>[] => {
      if (!onRemoveDuplicateByRef.current) return items;
      const seen = new Map<any, SearchResult<T>>();
      items.forEach((item) => {
        const key = onRemoveDuplicateByRef.current!(item.data);
        const existing = seen.get(key);
        if (!existing || (!existing.isOnline && item.isOnline)) {
          seen.set(key, item);
        }
      });
      return Array.from(seen.values());
    },
    []
  );

  const executeSearch = useCallback(
    createExecuteSearch<T, C>({
      onInitialDataRef,
      queryDataRef,
      onRemoveDuplicateByRef,
      searchAbortRef,
      cacheRef,
      removeDuplicates,
      setResults,
      setCursor,
      setInternalSearchState,
      minQueryLength,
    }),
    [removeDuplicates, minQueryLength]
  );

  const {
    searchValue,
    inputKey,
    shouldAutoFocus,
    searchInputRef,
    handleOpenEnd,
    handleSearchChange,
    handleClear,
  } = useSearchInput(isOpen, searchProp, debounceMs, executeSearch);

  // Latest query, read by the open/localDataDeps effect below without making `searchValue` a dependency.
  const searchValueRef = useRef(searchValue);
  searchValueRef.current = searchValue;

  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      setCursor(undefined);
      setInternalSearchState("initial");
      searchAbortRef.current?.abort("Component closed");
      paginationAbortRef.current?.abort("Component closed");
    }
  }, [isOpen]);

  useEffect(() => {
    onResultRef.current?.(results);
  }, [results]);

  // Re-run when the sheet OPENS or the caller signals local data changed (localDataDeps). Runs for local
  // viewers (onInitialData) and, when searchOnOpen is set, also for server-only viewers so they load
  // immediately instead of showing a blank sheet.
  //
  // `searchValue` is deliberately NOT a dependency: text-change searches are driven solely by the
  // DEBOUNCED input handler (useSearchInput → executeSearch). Listing it here re-ran an extra,
  // un-debounced executeSearch on every keystroke — the same query "loaded again" and the two requests
  // raced/aborted each other, which also stomped the pagination cursor. We read the latest query from a
  // ref so open + localDataDeps re-runs still use the current text.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && (onInitialDataRef.current || searchOnOpen)) {
      executeSearch(searchValueRef.current);
    }
  }, [isOpen, executeSearch, searchOnOpen, ...(localDataDeps ?? [])]);

  // Fetch the next page from `cursor`. Shared by the scroll handler and the
  // bottom-sentinel IntersectionObserver so pagination fires regardless of which
  // element actually scrolls (the sheet's own scroller vs .search-viewer-content).
  const loadMore = useCallback(async () => {
    if (isPaginating.current || !queryDataRef.current || !cursor) return;

    isPaginating.current = true;
    setInternalSearchState("loading");
    paginationAbortRef.current?.abort("New pagination request");
    paginationAbortRef.current = new AbortController();

    try {
      const signal = paginationAbortRef.current.signal;
      const result = await queryDataRef.current(cursor, searchValue, signal);
      if (signal.aborted) return;
      const newResults = result.data.map((data) => ({ isOnline: true, data }));
      setResults((prev) => removeDuplicates([...prev, ...newResults]));
      setCursor(result.cursor);
      setInternalSearchState("data");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setInternalSearchState("error");
    } finally {
      setTimeout(() => { isPaginating.current = false; }, 500);
    }
  }, [cursor, searchValue, removeDuplicates]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop > clientHeight * 1.2) return;
      loadMore();
    },
    [loadMore]
  );

  // Primary pagination trigger: a bottom sentinel + IntersectionObserver, so it
  // fires near the list end even when onScroll doesn't reach .search-viewer-content
  // (the sheet's own element may be the scroller). Modelled on navigation-stack's
  // useInfiniteScrollObserver: the observer is created ONCE when the sentinel
  // attaches and reads loadMore/hasMore/loading from live refs, so it never loops
  // (re-creating an observer while the sentinel is still in view would re-fire).
  const contentRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const canLoadRef = useRef(false);
  canLoadRef.current = !!queryDataRef.current && !!cursor && searchState !== "loading";

  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const attachSentinel = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node || typeof IntersectionObserver === "undefined") return;
    // Defer: a callback ref fires child-first during commit, so the ancestor
    // scroll container (contentRef) isn't attached yet. It is after a microtask.
    queueMicrotask(() => {
      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting || !canLoadRef.current) return;
          loadMoreRef.current();
        },
        // root:null (viewport) — IntersectionObserver honours clipping by whatever
        // ancestor actually scrolls (the sheet element or .search-viewer-content),
        // so this fires near the list end regardless of which one is the scroller.
        { root: null, rootMargin: "0px 0px 320px 0px", threshold: 0 }
      );
      observerRef.current.observe(node);
    });
  }, []);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  if (!isOpen && unmountOnClose) return null;

  const renderContent = () => {
    if (results.length > 0) {
      return (
        <>
          {children}
          {/* Bottom sentinel — when it scrolls into view (300px early) the next
              page is fetched; the spinner below then shows the in-flight load. */}
          {cursor && (
            <div
              ref={attachSentinel}
              className="search-viewer-sentinel"
              aria-hidden="true"
              style={{ height: 1, width: "100%" }}
            />
          )}
          {searchState === "loading" && (
            <div
              className="search-viewer-loading"
              style={{ padding: paddingStr(loadingProp?.padding), ...loadingProp?.style }}
            >
              {loadingProp?.view}
            </div>
          )}
        </>
      );
    }
    // Composed mode: a Column/Row descendant is reporting its own state (`reportedAggregate !== null`).
    // Those descendants own their OWN data/pagination and must stay mounted continuously to keep
    // reporting it — unmounting them here (as the plain single-query switch below does) would kill the
    // very reporter that produced this state, causing an unmount → state-resets-to-initial → remount
    // loop. So `children` always renders, and the loading/empty/error view — when relevant — is layered
    // alongside it (each empty/loading Row already renders nothing of its own), never in place of it.
    if (reportedAggregate !== null) {
      return (
        <>
          {children}
          {searchState === "loading" && (
            <div
              className="search-viewer-loading"
              style={{ padding: paddingStr(loadingProp?.padding), ...loadingProp?.style }}
            >
              {loadingProp?.view}
            </div>
          )}
          {searchState === "empty" && (
            <div
              className="search-viewer-no-results"
              style={{ padding: paddingStr(noResultProp?.padding), ...noResultProp?.style }}
            >
              {noResultProp?.view || (
                <div className="search-viewer-default-no-results">
                  {noResultProp?.text || "No results found"}
                </div>
              )}
            </div>
          )}
          {searchState === "error" && (
            <div
              className="search-viewer-error"
              style={{ padding: paddingStr(errorProp?.padding), ...errorProp?.style }}
            >
              {errorProp?.view || (
                <div className="search-viewer-default-error">
                  {errorProp?.text || "Something went wrong"}
                </div>
              )}
            </div>
          )}
        </>
      );
    }

    switch (searchState) {
      case "initial": return children;
      case "loading":
        return (
          <div
            className="search-viewer-loading"
            style={{ padding: paddingStr(loadingProp?.padding), ...loadingProp?.style }}
          >
            {loadingProp?.view}
          </div>
        );
      case "empty":
        return (
          <div
            className="search-viewer-no-results"
            style={{ padding: paddingStr(noResultProp?.padding), ...noResultProp?.style }}
          >
            {noResultProp?.view || (
              <div className="search-viewer-default-no-results">
                {noResultProp?.text || "No results found"}
              </div>
            )}
          </div>
        );
      case "error":
        return (
          <div
            className="search-viewer-error"
            style={{ padding: paddingStr(errorProp?.padding), ...errorProp?.style }}
          >
            {errorProp?.view || (
              <div className="search-viewer-default-error">
                {errorProp?.text || "Something went wrong"}
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <SearchViewerAggregateContext.Provider value={aggregateReporterValue}>
      <Sheet
        ref={sheetRef}
        isOpen={isOpen}
        onClose={onClose}
        detent="content"
        style={{ zIndex }}
        maxHeight={maxHeight}
        onOpenEnd={handleOpenEnd}
      >
        <Sheet.Container
          id={id}
          // Announced as a modal dialog. Without this a screen reader reads the sheet as one more
          // region of the page and gives no indication that what is behind it is unavailable — and
          // an automated check for an open dialog finds nothing at all.
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          style={{
            maxHeight: "100dvh",
            minHeight: "100%",
            maxWidth: layoutProp?.maxWidth || "800px",
            margin: "0 auto",
            width: "100%",
            left: 0,
            right: 0,
            paddingBottom: "calc(0px + env(safe-area-inset-bottom))",
            background: layoutProp?.searchBackground || layoutProp?.backgroundColor,
            borderTopLeftRadius: "0px",
            borderTopRightRadius: "0px",
          }}
        >
          <Sheet.Header>
            <SearchBar
              searchProp={searchProp}
              searchValue={searchValue}
              shouldAutoFocus={shouldAutoFocus}
              inputKey={inputKey}
              inputRef={searchInputRef}
              onChange={handleSearchChange}
              onBack={() => { onClose(); searchInputRef.current?.blur(); }}
              onClear={() => handleClear(executeSearch)}
            />
          </Sheet.Header>
          <Sheet.Content>
            <div
              ref={contentRef}
              className={`search-viewer-content ${childrenDirection}`}
              onScroll={queryDataRef.current ? handleScroll : undefined}
              style={{
                paddingTop: layoutProp?.gapBetweenSearchAndContent,
                paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 16}px` : "16px",
              }}
            >
              <SearchTextContext.Provider value={searchValue}>
                {renderContent()}
              </SearchTextContext.Provider>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={backDrop ? onClose : undefined} />
      </Sheet>
    </SearchViewerAggregateContext.Provider>
  );
}

export { SearchViewer };
