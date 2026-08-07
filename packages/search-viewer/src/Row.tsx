import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  type QueryResult,
  type SearchResult,
  type SearchState,
  RowAggregateContext,
  SearchTextContext,
  createExecuteSearch,
} from "./core";

export type RowProps<T = any, C = any> = {
  onInitialData?: (text: string) => T[];
  localDataDeps?: React.DependencyList;
  queryData?: (
    cursor: C | undefined,
    text: string,
    signal?: AbortSignal
  ) => Promise<QueryResult<T, C>>;
  onRemoveDuplicateBy?: (item: T) => any;
  debounceMs?: number;
  /** Don't call `queryData` until the trimmed query is at least this long. Default 0. */
  minQueryLength?: number;
  onResult?: (results: SearchResult<T>[]) => void;
  className?: string;
  style?: React.CSSProperties;
  children: (result: { searchState: SearchState; results: SearchResult<T>[] }) => React.ReactNode;
};

/** A horizontally-scrolling, independently-paginating section. Reuses the same
 *  query engine as `EachViewer` (debounce/cache/dedup via `createExecuteSearch`,
 *  live search text via `SearchTextContext`), but owns its own scroll container
 *  and paginates on HORIZONTAL scroll position rather than vertical — the
 *  natural adaptation of the vertical convention used everywhere else in this
 *  package, since a Row scrolls sideways. Reports its own `searchState` into
 *  the nearest `Column` (via `RowAggregateContext`) so the Column — and in turn
 *  the outer `SearchViewer` — can reflect it with no manual wiring. */
function Row<T = any, C = any>({
  onInitialData,
  localDataDeps,
  queryData,
  onRemoveDuplicateBy,
  debounceMs = 300,
  minQueryLength = 0,
  onResult,
  className,
  style,
  children,
}: RowProps<T, C>) {
  const searchText = React.useContext(SearchTextContext);
  const aggregateReporter = React.useContext(RowAggregateContext);
  const [rowId] = useState(() => `row-${Math.random().toString(36).substring(2, 11)}`);

  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [cursor, setCursor] = useState<C | undefined>(undefined);
  const [searchState, setSearchState] = useState<SearchState>("initial");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPaginating = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchAbortRef = useRef<AbortController | undefined>(undefined);
  const paginationAbortRef = useRef<AbortController | undefined>(undefined);
  const cacheRef = useRef<Map<string, QueryResult<T, C>>>(new Map());
  const onInitialDataRef = useRef(onInitialData);
  const queryDataRef = useRef(queryData);
  const onRemoveDuplicateByRef = useRef(onRemoveDuplicateBy);
  const onResultRef = useRef(onResult);

  onInitialDataRef.current = onInitialData;
  queryDataRef.current = queryData;
  onRemoveDuplicateByRef.current = onRemoveDuplicateBy;
  onResultRef.current = onResult;

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
      setInternalSearchState: setSearchState,
      minQueryLength,
    }),
    [removeDuplicates, minQueryLength]
  );

  const handleScroll = useCallback(async () => {
    const el = containerRef.current;
    if (!el || isPaginating.current || !queryDataRef.current || !cursor) return;

    // Horizontal equivalent of the vertical `scrollHeight - scrollTop <= clientHeight * 1.2`
    // trigger used everywhere else — a Row scrolls sideways, so its "near the end" check does too.
    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollWidth - scrollLeft > clientWidth * 1.2) return;

    isPaginating.current = true;
    setSearchState("loading");
    paginationAbortRef.current?.abort("New pagination request");
    paginationAbortRef.current = new AbortController();

    try {
      const signal = paginationAbortRef.current.signal;
      const result = await queryDataRef.current(cursor, searchText, signal);
      if (signal.aborted) return;

      const newResults = result.data.map((data) => ({ isOnline: true, data }));
      setResults((prev) => removeDuplicates([...prev, ...newResults]));
      setCursor(result.cursor);
      setSearchState("data");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setSearchState("error");
    } finally {
      setTimeout(() => { isPaginating.current = false; }, 500);
    }
  }, [cursor, searchText, removeDuplicates]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !queryDataRef.current) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!onInitialDataRef.current && !queryDataRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(searchText);
    }, debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, executeSearch, ...(localDataDeps ?? [])]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      searchAbortRef.current?.abort("Row unmounted");
      paginationAbortRef.current?.abort("Row unmounted");
    };
  }, []);

  useEffect(() => {
    onResultRef.current?.(results);
  }, [results]);

  useEffect(() => {
    aggregateReporter?.report(rowId, searchState);
    return () => aggregateReporter?.unreport(rowId);
  }, [aggregateReporter, rowId, searchState]);

  return (
    <div
      ref={containerRef}
      className={className ? `search-viewer-row ${className}` : "search-viewer-row"}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "8px",
        overflowX: "auto",
        overflowY: "hidden",
        ...style,
      }}
    >
      {children({ searchState, results })}
    </div>
  );
}

Row.displayName = "Row";

export { Row };
