import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  type EachViewerResult,
  type QueryResult,
  type SearchResult,
  type SearchState,
  SearchTextContext,
  createExecuteSearch,
} from "./core";

export type EachViewerProps<T = any, C = any> = {
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
  children: (result: EachViewerResult<T>) => React.ReactNode;
};

function EachViewer<T = any, C = any>({
  onInitialData,
  localDataDeps,
  queryData,
  onRemoveDuplicateBy,
  debounceMs = 300,
  minQueryLength = 0,
  children,
}: EachViewerProps<T, C>) {
  const searchText = React.useContext(SearchTextContext);
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [cursor, setCursor] = useState<C | undefined>(undefined);
  const [searchState, setSearchState] = useState<SearchState>("initial");

  const containerRef = useRef<HTMLElement>(null);
  const isPaginating = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchAbortRef = useRef<AbortController | undefined>(undefined);
  const paginationAbortRef = useRef<AbortController | undefined>(undefined);
  const cacheRef = useRef<Map<string, QueryResult<T, C>>>(new Map());
  const onInitialDataRef = useRef(onInitialData);
  const queryDataRef = useRef(queryData);
  const onRemoveDuplicateByRef = useRef(onRemoveDuplicateBy);

  onInitialDataRef.current = onInitialData;
  queryDataRef.current = queryData;
  onRemoveDuplicateByRef.current = onRemoveDuplicateBy;

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

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop > clientHeight * 1.2) return;

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

  // Attach scroll listener to whatever the user puts containerRef on
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
      searchAbortRef.current?.abort("EachViewer unmounted");
      paginationAbortRef.current?.abort("EachViewer unmounted");
    };
  }, []);

  return <>{children({ searchState, results, containerRef })}</>;
}

EachViewer.displayName = "EachViewer";

export { EachViewer };
