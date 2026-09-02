import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sheet } from "@academix-admin/modal-sheet";
import { useOverlayRoute } from '@academix-admin/overlay-route';

// ==================== Aggregation (Row/Column) ====================
// Independent from @academix-admin/search-viewer's equivalent (Library Charter: packages stay
// mutually independent) — same shape, duplicated intentionally rather than shared.

type AggregateReporter = {
  report: (id: string, state: SelectionState) => void;
  unreport: (id: string) => void;
};

/** A `Row` reports its own `state` into the nearest `Column` through this. */
const RowAggregateContext = React.createContext<AggregateReporter | null>(null);

/** `Column` reports its own aggregated state up through this — `SelectionViewer` provides it and
 *  merges whatever's reported into its own selectionState resolution, with zero extra wiring. */
const SelectionViewerAggregateContext = React.createContext<AggregateReporter | null>(null);

function computeAggregateState(states: SelectionState[]): SelectionState {
  if (states.length === 0) return "initial";
  if (states.some((s) => s === "data")) return "data";
  if (states.some((s) => s === "loading")) return "loading";
  if (states.every((s) => s === "empty")) return "empty";
  if (states.some((s) => s === "error")) return "error";
  return "initial";
}

// ==================== Types ====================
type Padding = {
  l: string;
  r: string;
  t: string;
  b: string;
};

type SnapPoint = number;

type SelectionState = "loading" | "empty" | "error" | "data" | "initial";


type TitleProps = {
  text: string;
  textColor: string;
  className?: string;
  containerClass?: string;
  style?: React.CSSProperties;
};

type SearchProps = {
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

type LoadingProps = {
  view: React.ReactNode;
  padding?: Padding;
  style?: React.CSSProperties;
};

type NoResultProps = {
  view: React.ReactNode;
  text?: string;
  padding?: Padding;
  style?: React.CSSProperties;
};

type ErrorProps = {
  view: React.ReactNode;
  text?: string;
  padding?: Padding;
  style?: React.CSSProperties;
};

type CancelButtonProps = {
  text?: string;
  view: React.ReactNode;
  position?: "left" | "right";
  style?: React.CSSProperties;
  onClick?: () => void;
  /**
   * What a screen reader calls it. Defaults to "Close".
   *
   * A button whose only content is an icon has no accessible name at all, so it was announced as
   * just "button" — the one control that dismisses the sheet, and nothing said so.
   */
  ariaLabel?: string;
};

type LayoutProps = {
  gapBetweenHandleAndTitle?: string;
  gapBetweenTitleAndSearch?: string;
  gapBetweenSearchAndContent?: string;
  /**
   * How far the rows are set in from the sides. Defaults to `16px`, matching the search box.
   *
   * The content had no inset while everything above it had 16px, so a list ran flush into the
   * sides of the screen under a search box that did not. Pass `0px` for rows that should reach
   * the edges.
   */
  contentPadding?: string;
  backgroundColor?: string;
  handleColor?: string;
  handleWidth?: string;
  fullScreenSearchBackground?: string;
  fullScreenSearchHeaderStyle?: React.CSSProperties;
  maxWidth?: string;
};

type SelectionViewerProps = {
  id?: string;
  isOpen: boolean;
  backDrop?: boolean;
  onClose: () => void;
  /**
   * Give this overlay its own history entry under this name, so the platform's own Back (and the
   * iOS edge-swipe, and Android's gesture) closes the OVERLAY rather than the page under it.
   *
   * Off by default, because it changes what the back gesture does and no existing consumer asked
   * for that. Without it, Back with this open closes it AND leaves the page behind it: measured in
   * a real shop, the gesture walked straight out of a half-built sale.
   *
   * The name must be unique among overlays that can be open together, or they mistake each other's
   * entry. Make it STABLE across page loads and the overlay can also come back after a refresh —
   * see `useOverlayRoute` in `@academix-admin/overlay-route`, which this uses and which any
   * component can use directly.
   */
  historyRoute?: string;
  titleProp: TitleProps;
  searchProp?: SearchProps;
  loadingProp?: LoadingProps;
  noResultProp?: NoResultProps;
  errorProp?: ErrorProps;
  cancelButton?: CancelButtonProps;
  layoutProp?: LayoutProps;
  childrenDirection?: "vertical" | "horizontal";
  children?: React.ReactNode;
  onPaginate?: () => boolean | Promise<boolean>;
  snapPoints?: SnapPoint[];
  initialSnap?: number;
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
  selectionState?: SelectionState;
  closeThreshold?: number;
};

// ==================== Styles ====================
const getStyles = (id: string) => `
#${id} .selection-viewer-header {
  padding: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}

/*
 * The close button, with a target a thumb can find.
 *
 * It sat at right: 0, top: 8 with no padding at all, so the icon was flush against the sheet's
 * edge and the only thing that could be tapped was the glyph itself — a target well under half
 * what a finger needs, in the corner of the screen where a thumb is least accurate. Inset by 4px
 * and padded out to 44px square, so the icon still reads as sitting in the corner while the
 * hittable area reaches the edges.
 *
 * The cancelButton.style prop is still spread last at the call site, so a consumer that was
 * overriding any of this keeps overriding it. (No backticks in here: this whole block lives
 * inside a template literal, and one would end the string.)
 */
#${id} .selection-viewer-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  border: none;
  background-color: transparent;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

#${id} .selection-viewer-drag-handle {
  height: 5px;
  border-radius: 3px;
  margin-top: 16px;
}

#${id} .selection-viewer-container {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

#${id} .selection-viewer-title {
  margin: 0px;
  font-size: 18px;
  font-weight: 600;
  padding: 0px 16px 0px 16px;
    word-break: break-word;   /* break long words */
    white-space: normal;      /* allow wrapping */
}

#${id} .selection-viewer-search {
  display: flex;
  align-items: center;
  margin: 16px 16px 4px 16px;
  border-radius: 12px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

#${id} .selection-viewer-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 8px;
  outline: none;
  font-size: 16px !important;
  width: 100%;
}

/*
 * The rows, set in from the edges like everything else in the sheet.
 *
 * The title and the search box have carried a 16px margin from the start; the content had none, so
 * a list of cards ran flush into the sides of the screen while the search box above it did not.
 * The layoutProp.contentPadding option overrides it for a consumer that wants its rows edge to
 * edge. (No backticks: this block is inside a template literal.)
 */
#${id} .selection-viewer-content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
}

#${id} .selection-viewer-content.vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#${id} .selection-viewer-content.horizontal {
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
}

#${id} .selection-viewer-no-results,
#${id} .selection-viewer-error,
#${id} .selection-viewer-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

#${id} .selection-viewer-default-no-results {
  color: #666;
  font-size: 14px;
}

#${id} .selection-viewer-default-error {
  color: red;
  font-size: 14px;
}

/* Full screen search mode */
#${id} .selection-viewer-fullscreen-search {
//   position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
//   padding-top: env(safe-area-inset-top);
  width: 100%;
}

#${id} .selection-viewer-search-back-button {
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

#${id} .selection-viewer-search-back-button:hover {
  opacity: 0.7;
}

#${id} .selection-viewer-search-clear-button {
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

#${id} .selection-viewer-search-clear-button:hover {
  opacity: 0.7;
}

/* React Modal Sheet overrides */
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


/* Mobile full-width behavior */
@media (max-width: 500px) {
  #${id} .react-modal-sheet-container {
    max-width: 100%;
    border-radius: 0;
  }
}

/* Prevent iOS zooming */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  #${id} .selection-viewer-search-input {
    font-size: 16px !important;
  }
}
`;

// ==================== Hook to inject CSS per instance ====================
const useInjectStyles = (id: string) => {
  useEffect(() => {
    const styleId = `selection-viewer-styles-${id}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = getStyles(id);
      document.head.appendChild(styleTag);
    }

    // Cleanup on unmount
    return () => {
      if (styleTag && document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
  }, [id]);
};

// ==================== Component ====================
/**
 * Escape closes the viewer, and Tab stays inside it.
 *
 * The viewer covers the screen, so what is behind it is not available — but nothing said so to the
 * keyboard. Tab walked out of the option list into the page underneath, where a person was
 * operating controls they could not see, and Escape did nothing at all, which is the one key
 * everybody reaches for to get out of a picker.
 *
 * Deliberately a private copy rather than an import from a sibling package: every library here
 * stands alone, and a shared helper between two of them is a dependency the consumer did not ask
 * for. Takes the container's `id` rather than a ref, because the sheet element belongs to the
 * underlying modal-sheet component; looking it up when a key is pressed finds it however that
 * component chooses to mount it. Focusables are re-queried on every Tab, since the option list
 * changes as the consumer filters it and a list captured on open is a list of dead elements.
 */
const useModalKeys = (isOpen: boolean, onClose: () => void, containerId: string) => {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = document.getElementById(containerId)?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
          ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, containerId]);
};

const SelectionViewer: React.FC<SelectionViewerProps> = ({
  id: providedId,
  isOpen,
  historyRoute,
  backDrop = true,
  onClose,
  titleProp,
  searchProp,
  loadingProp,
  noResultProp,
  errorProp,
  cancelButton,
  layoutProp,
  childrenDirection = "vertical",
  children,
  onPaginate,
  snapPoints = [0, 1],
  initialSnap = 1,
  unmountOnClose = true,
  zIndex = 1000,
  ariaLabel,
  maxHeight = "90dvh",
  minHeight = "65dvh",
  selectionState: selectionStateProp = "initial",
  closeThreshold = 0.2,
}) => {

  /*
   * THE BACK GESTURE CLOSES THIS, NOT THE PAGE UNDER IT.
   *
   * Only when the consumer named a route: `useOverlayRoute` is a no-op with an empty name, and an
   * overlay that never asked for a history entry must not acquire one, or Back starts meaning
   * something different in an app that did not opt in.
   *
   * The capability lives in its own package rather than here, so that an app wanting a
   * back-closable sheet does not have to take a router with it — and so that a navigation library
   * can supply the history writing without either package importing the other.
   */
  useOverlayRoute(historyRoute ?? '', Boolean(historyRoute) && isOpen, onClose);
  const [id] = useState(() => providedId || `selection-${Math.random().toString(36).substring(2, 11)}`);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const isPaginating = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<any>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useInjectStyles(id);
  // Escape closes the viewer and Tab stays inside it — see useModalKeys.
  useModalKeys(isOpen, onClose, id);

  // Descendant sections (a Column, or anything else) can report a cumulative state up through this —
  // starts empty, so a plain SelectionViewer with no Row/Column children behaves exactly as before.
  const [reportedStates, setReportedStates] = useState<Map<string, SelectionState>>(new Map());
  const reportAggregate = useCallback((reporterId: string, state: SelectionState) => {
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
  const isComposed = reportedAggregate !== null;

  // Precedence: an explicit `selectionState` prop always wins (matches today's exact behaviour for
  // any consumer not using Row/Column) -> then a reported Column aggregate, if one exists -> "initial".
  const selectionState =
    selectionStateProp !== "initial" ? selectionStateProp : reportedAggregate ?? "initial";

  // Track keyboard height
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vp = window.visualViewport!;
      const kbHeight = window.innerHeight - vp.height;
      setKeyboardHeight(kbHeight > 0 ? kbHeight : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Auto-focus on search
  useEffect(() => {
    if (!isOpen) {
      searchInputRef.current?.blur();
      setSearchValue("");
      searchProp?.onChange?.("");
      setShouldAutoFocus(false);
      return;
    }
  }, [isOpen, searchProp?.autoFocus]);

  const handleOpenEnd = useCallback(() => {
    if (searchProp?.autoFocus && searchInputRef.current) {
      setInputKey(prev => prev + 1);
      setShouldAutoFocus(true);
      searchInputRef.current.focus();
      searchInputRef.current.click();
    }
  }, [searchProp?.autoFocus]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    searchProp?.onChange?.(value);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    searchProp?.onFocus?.();
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleSearchBlur = () => {
    searchProp?.onBlur?.();
  };

  const handleBackFromSearch = () => {
    setIsSearchFocused(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    searchProp?.onChange?.("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (isPaginating.current || !onPaginate) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2;

      if (isNearBottom) {
        isPaginating.current = true;
        const hasMore = await onPaginate();
        if (!hasMore) {
          isPaginating.current = false;
        } else {
          setTimeout(() => {
            isPaginating.current = false;
          }, 500);
        }
      }
    },
    [onPaginate]
  );

  if (!isOpen && unmountOnClose) return null;

  return (
    <SelectionViewerAggregateContext.Provider value={aggregateReporterValue}>
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
          maxHeight: maxHeight,
          minHeight: isSearchFocused ? "100dvh" : minHeight,
          maxWidth: layoutProp?.maxWidth ?? '800px',
          margin: "0 auto",
          width: "100%",
          left: 0,
          right: 0,
          paddingBottom: "calc(0px + env(safe-area-inset-bottom))",
          background: isSearchFocused
            ? layoutProp?.fullScreenSearchBackground || layoutProp?.backgroundColor
            : layoutProp?.backgroundColor,
          borderTopLeftRadius: isSearchFocused ? "0px" : "16px",
          borderTopRightRadius: isSearchFocused ? "0px" : "16px",
        }}
      >
        {isSearchFocused ? (
          <Sheet.Header>
            <div
              className="selection-viewer-fullscreen-search"
              style={layoutProp?.fullScreenSearchHeaderStyle}
            >
              <div className="selection-viewer-search" style={{
                ...searchProp?.containerStyle,
                background: searchProp?.background,
                padding: searchProp?.padding
                  ? `${searchProp.padding.t} ${searchProp.padding.r} ${searchProp.padding.b} ${searchProp.padding.l}`
                  : "16px"
              }}>
                <button
                  className="selection-viewer-search-back-button"
                  onClick={handleBackFromSearch}
                  aria-label="Exit search mode"
                >
                  {searchProp?.backIcon || (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18L9 12L15 6" stroke={searchProp?.textColor || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <input
                  key={inputKey}
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchProp?.text}
                  value={searchValue}
                  onChange={handleSearchChange}
                  className={searchProp?.className || "selection-viewer-search-input"}
                  style={{
                    color: searchProp?.textColor,
                    ...searchProp?.inputStyle
                  }}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  autoFocus={shouldAutoFocus}
                />

                {searchValue && (
                  <button
                    className="selection-viewer-search-clear-button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    {searchProp?.clearIcon || (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke={searchProp?.textColor || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </Sheet.Header>
        ) : (
          <Sheet.Header>
            <div className="selection-viewer-header">
              {/* Cancel button left */}
              {cancelButton?.position === "left" && (
                <button
                  aria-label={cancelButton.ariaLabel || "Close"}
                  className="selection-viewer-cancel"
                  style={{
                    position: "absolute",
                    left: "4px",
                    top: "4px",
                    ...cancelButton.style
                  }}
                  onClick={cancelButton.onClick || onClose}
                >
                  {cancelButton.view || cancelButton.text || "Cancel"}
                </button>
              )}

              {/* Drag handle */}
              {!isSearchFocused && (
                <div
                  className="selection-viewer-drag-handle"
                  style={{
                    background: layoutProp?.handleColor || "#ccc",
                    width: layoutProp?.handleWidth || "40px",
                    marginBottom: layoutProp?.gapBetweenHandleAndTitle || "12px",
                  }}
                />
              )}

              {/* Cancel button right */}
              {cancelButton?.position === "right" && (
                <button
                  aria-label={cancelButton.ariaLabel || "Close"}
                  className="selection-viewer-cancel"
                  style={{
                    position: "absolute",
                    right: "4px",
                    top: "4px",
                    ...cancelButton.style
                  }}
                  onClick={cancelButton.onClick || onClose}
                >
                  {cancelButton.view || cancelButton.text || "Cancel"}
                </button>
              )}

              {/* Title */}
              <div className={titleProp.containerClass || "selection-viewer-container"}>
                <h2
                  id={`${id}-title`}
                  className={titleProp.className || "selection-viewer-title"}
                  style={{
                    marginBottom: layoutProp?.gapBetweenTitleAndSearch || "8px",
                    color: titleProp?.textColor || 'black',
                    ...titleProp.style
                  }}
                >
                  {titleProp.text}
                </h2>
              </div>
            </div>

            {/* Search */}
            {searchProp && (
              <div
                className="selection-viewer-search"
                style={{
                  background: searchProp.background,
                  padding: searchProp.padding
                    ? `${searchProp.padding.t} ${searchProp.padding.r} ${searchProp.padding.b} ${searchProp.padding.l}`
                    : "8px 16px",
                  marginBottom: layoutProp?.gapBetweenSearchAndContent,
                  ...searchProp.containerStyle
                }}
              >
                {searchProp.prefixIcon && (
                  <span style={{ marginRight: searchProp.prefixGap || "8px" }}>
                    {searchProp.prefixIcon}
                  </span>
                )}
                <input
                  key={inputKey}
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchProp.text}
                  value={searchValue}
                  onChange={handleSearchChange}
                  className={searchProp.className || "selection-viewer-search-input"}
                  style={{
                    color: searchProp?.textColor,
                    ...searchProp.inputStyle
                  }}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  autoFocus={shouldAutoFocus}
                />
                {searchValue && (
                  <button
                    className="selection-viewer-search-clear-button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    style={{ marginLeft: searchProp.suffixGap || "8px" }}
                  >
                    {searchProp.clearIcon || searchProp.suffixIcon || (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}
                {!searchValue && searchProp.suffixIcon && (
                  <span style={{ marginLeft: searchProp.suffixGap || "8px" }}>
                    {searchProp.suffixIcon}
                  </span>
                )}
              </div>
            )}
          </Sheet.Header>
        )}

        <Sheet.Content>
          <div
            className={`selection-viewer-content ${childrenDirection}`}
            onScroll={onPaginate ? handleScroll : undefined}
            style={{
              paddingTop: isSearchFocused ? layoutProp?.gapBetweenSearchAndContent : '0',
              paddingBottom: keyboardHeight > 0
                ? `${keyboardHeight + 16}px`
                : '16px',
              /*
               * Set in from the edges, like everything else in the sheet.
               *
               * The title and the search box have carried 16px from the start and the content had
               * none, so a list of rows ran flush into the sides of the screen under a search box
               * that did not. Overridable for rows that genuinely want the full width.
               */
              paddingLeft: layoutProp?.contentPadding ?? '16px',
              paddingRight: layoutProp?.contentPadding ?? '16px',
            }}
          >
            {/* Show children first, then loading at bottom */}
            {React.Children.count(children) > 0 ? (
              <>
                {children}
                {selectionState === "loading" && (
                  <div
                    className="selection-viewer-loading"
                    style={{
                      padding: loadingProp?.padding
                        ? `${loadingProp.padding.t} ${loadingProp.padding.r} ${loadingProp.padding.b} ${loadingProp.padding.l}`
                        : "16px",
                      ...loadingProp?.style
                    }}
                  >
                    {loadingProp?.view}
                  </div>
                )}
                {/*
                  Shown ALONGSIDE the children, not instead of them.

                  This was guarded on composed mode — a Column/Row descendant reporting its own
                  state — on the reasoning that only a composed sheet can have children and be
                  empty at the same time. That is not true of the commonest arrangement there is:
                  a consumer that wraps its rows in a single container. `React.Children.count` is
                  then 1 whether the container holds fifty rows or none, so the empty branch below
                  never ran and the sheet showed a blank white screen — at the exact moment
                  somebody had searched for something that is not there, which is when the empty
                  state is the only useful thing on screen.

                  Layered rather than substituted, for the reason the composed case already had:
                  a child that reports its own state must stay mounted to go on reporting. A
                  consumer whose `selectionState` says "empty" is asserting there is nothing to
                  show, so drawing its own view beside visually-empty children is what it asked
                  for.
                */}
                {selectionState === "empty" && (
                  <div
                    className="selection-viewer-no-results"
                    style={{
                      padding: noResultProp?.padding
                        ? `${noResultProp.padding.t} ${noResultProp.padding.r} ${noResultProp.padding.b} ${noResultProp.padding.l}`
                        : "16px",
                      ...noResultProp?.style
                    }}
                  >
                    {noResultProp?.view || (
                      <div className="selection-viewer-default-no-results">
                        {noResultProp?.text || "No results found"}
                      </div>
                    )}
                  </div>
                )}
                {selectionState === "error" && (
                  <div
                    className="selection-viewer-error"
                    style={{
                      padding: errorProp?.padding
                        ? `${errorProp.padding.t} ${errorProp.padding.r} ${errorProp.padding.b} ${errorProp.padding.l}`
                        : "16px",
                      ...errorProp?.style
                    }}
                  >
                    {errorProp?.view || (
                      <div className="selection-viewer-default-error">
                        {errorProp?.text || "No results found"}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (selectionState === "empty" || (React.Children.count(children) <= 0 && (selectionState != "loading" && selectionState != "error"))) ? (
              <div
                className="selection-viewer-no-results"
                style={{
                  padding: noResultProp?.padding
                    ? `${noResultProp.padding.t} ${noResultProp.padding.r} ${noResultProp.padding.b} ${noResultProp.padding.l}`
                    : "16px",
                  ...noResultProp?.style
                }}
              >
                {noResultProp?.view || (
                  <div className="selection-viewer-default-no-results">
                    {noResultProp?.text || "No results found"}
                  </div>
                )}
              </div>
            ) : selectionState === "loading" ? (
              <div
                className="selection-viewer-loading"
                style={{
                  padding: loadingProp?.padding
                    ? `${loadingProp.padding.t} ${loadingProp.padding.r} ${loadingProp.padding.b} ${loadingProp.padding.l}`
                    : "16px",
                  ...loadingProp?.style
                }}
              >
                {loadingProp?.view}
              </div>
            ) : (selectionState === "error") ? (
              <div
                className="selection-viewer-error"
                style={{
                  padding: errorProp?.padding
                    ? `${errorProp.padding.t} ${errorProp.padding.r} ${errorProp.padding.b} ${errorProp.padding.l}`
                    : "16px",
                  ...errorProp?.style
                }}
              >
                {errorProp?.view || (
                  <div className="selection-viewer-default-error">
                    {errorProp?.text || "No results found"}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={backDrop ? onClose : undefined} />
    </Sheet>
    </SelectionViewerAggregateContext.Provider>
  );
};

// ==================== Controller Hook ====================
type Operation = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSelectionState: (val: SelectionState) => void;
};

const useSelectionController = (initialSelectionState?: SelectionState): [
  string,
  Operation,
  boolean,
  SelectionState
] => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionState, setSelectionState] = useState(initialSelectionState || 'initial');
  const [selectionId] = useState(() => `selection-${Math.random().toString(36).substring(2, 11)}`);

  const operations = useMemo<Operation>(() => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    setSelectionState
  }), [setSelectionState]);

  return [selectionId, operations, isOpen, selectionState];
};

export { SelectionViewer, useSelectionController, RowAggregateContext, SelectionViewerAggregateContext, computeAggregateState };
export type {
  SelectionViewerProps,
  SelectionState,
  TitleProps,
  SearchProps,
  LoadingProps,
  NoResultProps,
  ErrorProps,
  CancelButtonProps,
  LayoutProps,
  Padding,
  SnapPoint,
  AggregateReporter,
};
export default SelectionViewer;
