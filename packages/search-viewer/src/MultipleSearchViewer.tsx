import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from "@academix-admin/modal-sheet";
import {
  SearchBar,
  SearchTextContext,
  getSearchViewerStyles,
  useInjectStyles,
  useKeyboardHeight,
  useModalKeys,
  useSearchInput,
} from "./core";
import type { EachViewerProps } from "./EachViewer";
import type { SearchViewerProps } from "./SearchViewer";

export type MultipleSearchViewerProps = Omit<
  SearchViewerProps,
  | "children"
  | "onInitialData"
  | "localDataDeps"
  | "queryData"
  | "onResult"
  | "onRemoveDuplicateBy"
  | "childrenDirection"
  | "searchState"
  | "loadingProp"
  | "noResultProp"
  | "errorProp"
> & {
  children:
    | React.ReactElement<EachViewerProps>
    | React.ReactElement<EachViewerProps>[];
};

function MultipleSearchViewer({
  id: providedId,
  isOpen,
  backDrop = true,
  onClose,
  searchProp,
  layoutProp,
  children,
  unmountOnClose = true,
  zIndex = 1000,
  maxHeight = "90dvh",
  debounceMs = 300,
}: MultipleSearchViewerProps) {
  const [id] = useState(
    () => providedId || `multi-search-${Math.random().toString(36).substring(2, 11)}`
  );
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const sheetRef = useRef<any>(null);

  useInjectStyles(id, "search-viewer-styles", getSearchViewerStyles);
  const keyboardHeight = useKeyboardHeight();
  // Escape closes the viewer and Tab stays inside it — see useModalKeys.
  useModalKeys(isOpen, onClose, id);

  const handleDebouncedSearch = useCallback((value: string) => {
    setDebouncedSearchValue(value);
  }, []);

  const {
    searchValue,
    inputKey,
    shouldAutoFocus,
    searchInputRef,
    debounceRef,
    handleOpenEnd,
    handleSearchChange,
    handleClear,
  } = useSearchInput(isOpen, searchProp, debounceMs, handleDebouncedSearch);

  useEffect(() => {
    if (!isOpen) {
      setDebouncedSearchValue("");
      clearTimeout(debounceRef.current);
    }
  }, [isOpen]);

  if (!isOpen && unmountOnClose) return null;

  return (
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
            onClear={() => handleClear(handleDebouncedSearch)}
          />
        </Sheet.Header>
        <Sheet.Content>
          <div
            style={{
              paddingTop: layoutProp?.gapBetweenSearchAndContent,
              paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 16}px` : "16px",
            }}
          >
            <SearchTextContext.Provider value={debouncedSearchValue}>
              {children}
            </SearchTextContext.Provider>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={backDrop ? onClose : undefined} />
    </Sheet>
  );
}

MultipleSearchViewer.displayName = "MultipleSearchViewer";

export { MultipleSearchViewer };
