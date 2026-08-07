import React, { useCallback, useEffect, useRef, useState } from "react";

// ==================== Shared types ====================

export type Padding = { l: string; r: string; t: string; b: string };

export type SearchState = "loading" | "empty" | "error" | "data" | "initial";

export type QueryResult<T, C> = {
  data: T[];
  cursor?: C;
};

export type SearchResult<T> = {
  isOnline: boolean;
  data: T;
};

export type EachViewerResult<T> = {
  searchState: SearchState;
  results: SearchResult<T>[];
  containerRef: React.RefObject<HTMLElement | null>;
};

export type SearchProps = {
  text: string;
  textColor: string;
  className?: string;
  background?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  clearIcon?: React.ReactNode;
  backIcon?: React.ReactNode;
  prefixGap?: string;
  suffixGap?: string;
  padding?: Padding;
  autoFocus?: boolean;
  inputStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export type LoadingProps = {
  view: React.ReactNode;
  padding?: Padding;
  style?: React.CSSProperties;
};

export type NoResultProps = {
  view: React.ReactNode;
  text?: string;
  padding?: Padding;
  style?: React.CSSProperties;
};

export type ErrorProps = {
  view: React.ReactNode;
  text?: string;
  padding?: Padding;
  style?: React.CSSProperties;
};

export type LayoutProps = {
  gapBetweenHandleAndTitle?: string;
  gapBetweenTitleAndSearch?: string;
  gapBetweenSearchAndContent?: string;
  backgroundColor?: string;
  handleColor?: string;
  handleWidth?: string;
  searchBackground?: string;
  searchHeaderStyle?: React.CSSProperties;
  maxWidth?: string;
};

// ==================== Style helpers ====================

export const paddingStr = (p?: Padding, fallback = "16px") =>
  p ? `${p.t} ${p.r} ${p.b} ${p.l}` : fallback;

/** Shared CSS for every sheet-shaped component in this package (`SearchViewer`,
 *  `MultipleSearchViewer`) — kept as ONE source so their class names/behaviour never drift apart. */
export const getSearchViewerStyles = (id: string) => `
#${id} .search-viewer-header {
  padding: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}
#${id} .search-viewer-search {
  display: flex;
  align-items: center;
  margin: 16px 16px 4px 16px;
  border-radius: 12px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
#${id} .search-viewer-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 8px;
  outline: none;
  font-size: 16px !important;
  width: 100%;
}
#${id} .search-viewer-content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-height: 0;
}
#${id} .search-viewer-content.vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
#${id} .search-viewer-content.horizontal {
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
}
#${id} .search-viewer-no-results,
#${id} .search-viewer-error,
#${id} .search-viewer-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}
#${id} .search-viewer-fullscreen-search {
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  width: 100%;
}
#${id} .search-viewer-search-back-button {
  background: none;
  border: none;
  padding: 8px;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}
#${id} .search-viewer-search-back-button:hover { opacity: 0.7; }
#${id} .search-viewer-search-clear-button {
  background: none;
  border: none;
  padding: 8px;
  margin-left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}
#${id} .search-viewer-search-clear-button:hover { opacity: 0.7; }
#${id} .react-modal-sheet-container {
  max-width: 500px;
  margin: 0 auto;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
#${id} .react-modal-sheet-backdrop {
  background-color: rgba(0, 0, 0, 0.5) !important;
  pointer-events: auto !important;
}
#${id} .react-modal-sheet-content {
  padding: 0 0px 0px 0px;
  height: 100%;
}
@media (max-width: 500px) {
  #${id} .react-modal-sheet-container {
    max-width: 100%;
    border-radius: 0;
  }
}
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  #${id} .search-viewer-search-input {
    font-size: 16px !important;
  }
}
`;

/** Injects `getStyles(id)` into a `<style id="{prefix}-{id}">` tag once per mounted instance,
 *  removing it on unmount. Shared by every sheet-shaped component in this package. */
export const useInjectStyles = (
  id: string,
  prefix: string,
  getStyles: (id: string) => string
) => {
  useEffect(() => {
    const styleId = `${prefix}-${id}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = getStyles(id);
      document.head.appendChild(styleTag);
    }
    return () => {
      if (styleTag && document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
};

// ==================== Back / Clear icons ====================

export const DefaultBackIcon = ({ color }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 18L9 12L15 6"
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DefaultClearIcon = ({ color }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ==================== Shared search bar ====================

export type SearchBarProps = {
  searchProp?: SearchProps;
  searchValue: string;
  shouldAutoFocus: boolean;
  inputKey: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onClear: () => void;
};

export const SearchBar = ({
  searchProp,
  searchValue,
  shouldAutoFocus,
  inputKey,
  inputRef,
  onChange,
  onBack,
  onClear,
}: SearchBarProps) => (
  <div className="search-viewer-fullscreen-search" style={undefined}>
    <div
      className="search-viewer-search"
      style={{
        ...searchProp?.containerStyle,
        background: searchProp?.background,
        padding: paddingStr(searchProp?.padding, "16px"),
      }}
    >
      <button
        className="search-viewer-search-back-button"
        onClick={onBack}
        aria-label="Exit search mode"
      >
        {searchProp?.backIcon || <DefaultBackIcon color={searchProp?.textColor} />}
      </button>
      <input
        key={inputKey}
        ref={inputRef}
        type="text"
        placeholder={searchProp?.text}
        value={searchValue}
        onChange={onChange}
        className={searchProp?.className || "search-viewer-search-input"}
        style={{ color: searchProp?.textColor, ...searchProp?.inputStyle }}
        onFocus={searchProp?.onFocus}
        onBlur={searchProp?.onBlur}
        autoFocus={shouldAutoFocus}
      />
      {searchValue && (
        <button
          className="search-viewer-search-clear-button"
          onClick={onClear}
          aria-label="Clear search"
        >
          {searchProp?.clearIcon || <DefaultClearIcon color={searchProp?.textColor} />}
        </button>
      )}
    </div>
  </div>
);

// ==================== useSearchInput hook ====================

export const useSearchInput = (
  isOpen: boolean,
  searchProp?: SearchProps,
  debounceMs = 300,
  onSearch?: (value: string) => void
) => {
  const [searchValue, setSearchValue] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      searchInputRef.current?.blur();
      setSearchValue("");
      searchProp?.onChange?.("");
      setShouldAutoFocus(false);
      clearTimeout(debounceRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleOpenEnd = useCallback(() => {
    if (searchProp?.autoFocus && searchInputRef.current) {
      setInputKey((prev) => prev + 1);
      setShouldAutoFocus(true);
      searchInputRef.current.focus();
    }
  }, [searchProp?.autoFocus]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      searchProp?.onChange?.(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch?.(value);
      }, debounceMs);
    },
    [debounceMs, onSearch, searchProp]
  );

  const handleClear = useCallback(
    (onSearch?: (v: string) => void) => {
      setSearchValue("");
      searchProp?.onChange?.("");
      clearTimeout(debounceRef.current);
      onSearch?.("");
      searchInputRef.current?.focus();
    },
    [searchProp]
  );

  return {
    searchValue,
    setSearchValue,
    inputKey,
    shouldAutoFocus,
    searchInputRef,
    debounceRef,
    handleOpenEnd,
    handleSearchChange,
    handleClear,
  };
};

// ==================== useKeyboardHeight hook ====================

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const handleResize = () => {
      const vp = window.visualViewport!;
      const kbHeight = window.innerHeight - vp.height;
      setKeyboardHeight(kbHeight > 0 ? kbHeight : 0);
    };
    const vp = window.visualViewport;
    vp.addEventListener("resize", handleResize);
    vp.addEventListener("scroll", handleResize);
    return () => {
      vp.removeEventListener("resize", handleResize);
      vp.removeEventListener("scroll", handleResize);
    };
  }, []);

  return keyboardHeight;
};

// ==================== Shared search executor factory ====================

const MAX_CACHE = 50;

type SearchExecutorOptions<T, C> = {
  onInitialDataRef: React.MutableRefObject<((text: string) => T[]) | undefined>;
  queryDataRef: React.MutableRefObject<
    | ((cursor: C | undefined, text: string, signal?: AbortSignal) => Promise<QueryResult<T, C>>)
    | undefined
  >;
  onRemoveDuplicateByRef: React.MutableRefObject<((item: T) => any) | undefined>;
  searchAbortRef: React.MutableRefObject<AbortController | undefined>;
  cacheRef: React.MutableRefObject<Map<string, QueryResult<T, C>>>;
  removeDuplicates: (items: SearchResult<T>[]) => SearchResult<T>[];
  setResults: React.Dispatch<React.SetStateAction<SearchResult<T>[]>>;
  setCursor: React.Dispatch<React.SetStateAction<C | undefined>>;
  setInternalSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  /** Don't hit the server until the (trimmed) query is at least this long. Default 0 (always). */
  minQueryLength?: number;
};

export function createExecuteSearch<T, C>(opts: SearchExecutorOptions<T, C>) {
  const minQueryLength = opts.minQueryLength ?? 0;
  return async (value: string) => {
    const {
      onInitialDataRef,
      queryDataRef,
      searchAbortRef,
      cacheRef,
      removeDuplicates,
      setResults,
      setCursor,
      setInternalSearchState,
    } = opts;

    let localResults: SearchResult<T>[] = [];
    if (onInitialDataRef.current) {
      const filtered = onInitialDataRef.current(value);
      localResults = filtered.map((data) => ({ isOnline: false, data }));
    }
    const localDedup = removeDuplicates(localResults);
    // "Below min" only applies to NON-EMPTY short queries (e.g. a single char). The EMPTY query is the
    // default browse view — it must still hit the server so it gets a first page + cursor and can paginate
    // as the user scrolls. Skipping the server here left the no-text list with no cursor (no pagination).
    const belowMin = value.trim().length > 0 && value.trim().length < minQueryLength;

    // Server search — but only when a queryData exists AND the query is long enough. Below the min length
    // we stay local-only (no wasted/erroring empty-query requests).
    if (queryDataRef.current && !belowMin) {
      const cached = cacheRef.current.get(value);
      if (cached) {
        const remoteResults = cached.data.map((data) => ({ isOnline: true, data }));
        const deduplicated = removeDuplicates([...localResults, ...remoteResults]);
        setResults(deduplicated);
        setCursor(cached.cursor);
        setInternalSearchState(deduplicated.length > 0 ? "data" : "empty");
        return;
      }

      if (searchAbortRef.current) {
        searchAbortRef.current.abort("New search initiated");
      }
      searchAbortRef.current = new AbortController();

      // INSTANT local paint: show local matches immediately while the server request is in flight, so the
      // list never lingers on the PREVIOUS query's results during the debounce + network wait.
      setResults(localDedup);
      setInternalSearchState("loading");
      setCursor(undefined);

      try {
        const signal = searchAbortRef.current.signal;
        const result = await queryDataRef.current(undefined, value, signal);
        if (signal.aborted) return;

        cacheRef.current.set(value, result);
        if (cacheRef.current.size > MAX_CACHE) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey !== undefined) cacheRef.current.delete(firstKey);
        }

        const remoteResults = result.data.map((data) => ({ isOnline: true, data }));
        const deduplicated = removeDuplicates([...localResults, ...remoteResults]);
        setResults(deduplicated);
        setCursor(result.cursor);
        setInternalSearchState(deduplicated.length > 0 ? "data" : "empty");
      } catch (error: any) {
        if (error.name === "AbortError") return;
        // Robustness: a failed server request shouldn't blank out matches we already have locally.
        if (localDedup.length > 0) {
          setResults(localDedup);
          setInternalSearchState("data");
        } else {
          setInternalSearchState("error");
        }
      }
    } else {
      // Local-only (or below the min query length). An EMPTY query returns to the initial view rather than
      // flashing "no results".
      setResults(localDedup);
      setInternalSearchState(
        localDedup.length > 0 ? "data" : value.trim().length > 0 ? "empty" : "initial"
      );
    }
  };
}

// ==================== Contexts ====================

/** The live (debounced) search text — provided by `SearchViewer`/`MultipleSearchViewer`, read by
 *  `EachViewer`/`Row` so a section can re-query as the shared text changes without prop-drilling. */
export const SearchTextContext = React.createContext<string>("");

export type AggregateReporter = {
  report: (id: string, state: SearchState) => void;
  unreport: (id: string) => void;
};

/** A `Row` reports its own `searchState` into the nearest `Column` through this — `Column` provides
 *  it, aggregates every reported state, and is itself a reporter one level up (see below). */
export const RowAggregateContext = React.createContext<AggregateReporter | null>(null);

/** `Column` (or any future composite) reports its OWN aggregated state up through this — `SearchViewer`
 *  provides it and merges whatever's reported into its own loading/empty/error/data resolution, so the
 *  outer sheet's `loadingProp`/`noResultProp`/`errorProp` react automatically with zero extra wiring. */
export const SearchViewerAggregateContext = React.createContext<AggregateReporter | null>(null);

/** Combines however many sections reported a state into ONE cumulative `SearchState`.
 *  - any section has real data -> "data" (render content; mixed sections handle their own display)
 *  - none have data, but at least one is still loading -> "loading"
 *  - none have data, every section concluded "empty" -> "empty"
 *  - none have data, at least one errored (and none still loading) -> "error"
 *  - nothing has reported anything yet -> "initial" */
export function computeAggregateState(states: SearchState[]): SearchState {
  if (states.length === 0) return "initial";
  if (states.some((s) => s === "data")) return "data";
  if (states.some((s) => s === "loading")) return "loading";
  if (states.every((s) => s === "empty")) return "empty";
  if (states.some((s) => s === "error")) return "error";
  return "initial";
}

// ==================== useSearchController ====================

export type SearchOperation = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchState: (val: SearchState) => void;
};

export const useSearchController = (
  initialSearchState?: SearchState
): [string, SearchOperation, boolean, SearchState] => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState ?? "initial");
  const [searchId] = useState(() => `search-${Math.random().toString(36).substring(2, 11)}`);

  const operations = React.useMemo<SearchOperation>(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      setSearchState,
    }),
    []
  );

  return [searchId, operations, isOpen, searchState];
};
