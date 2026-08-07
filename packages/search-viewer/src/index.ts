// Public exports below are kept byte-identical to the pre-split package (verified against the
// original monolithic SearchViewer.tsx's single export block) — this split is non-breaking.
export { SearchViewer } from './SearchViewer';
export type { SearchViewerProps } from './SearchViewer';

export { MultipleSearchViewer } from './MultipleSearchViewer';
export type { MultipleSearchViewerProps } from './MultipleSearchViewer';

export { EachViewer } from './EachViewer';
export type { EachViewerProps } from './EachViewer';

export { useSearchController } from './core';
export type { SearchResult, EachViewerResult } from './core';

// New in this release — composable, independently-paginating sections (additive, minor bump).
export { Row } from './Row';
export type { RowProps } from './Row';

export { Column } from './Column';
export type { ColumnProps } from './Column';

export type { SearchState } from './core';
