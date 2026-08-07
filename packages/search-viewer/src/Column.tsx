import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  type SearchState,
  RowAggregateContext,
  SearchViewerAggregateContext,
  computeAggregateState,
} from "./core";

export type ColumnProps = {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** A vertical arrangement of `Row`s (or other sections, or plain content) — the
 *  explicit, composable equivalent of today's flat `children` list. Its default
 *  layout is deliberately identical to the existing
 *  `.search-viewer-content.vertical` rendering (`flex-direction: column, gap: 8px`)
 *  so today's flat usage is, unchanged, "an implicit Column with no Rows."
 *
 *  Provides the `RowAggregateContext` its `Row` children report into, computes
 *  ONE cumulative state from everything reported, and is itself a reporter one
 *  level up: if nested inside another `Column` it reports through that Column's
 *  `RowAggregateContext` (behaving like a Row); at the top level it reports
 *  through `SearchViewerAggregateContext`, which `SearchViewer` provides — this
 *  is what makes the outer sheet's loading/empty/error views react automatically
 *  with zero manual wiring, and lets Columns nest arbitrarily deep. */
function Column({ id: providedId, className, style, children }: ColumnProps) {
  const [columnId] = useState(
    () => providedId || `column-${Math.random().toString(36).substring(2, 11)}`
  );

  const [reportedStates, setReportedStates] = useState<Map<string, SearchState>>(new Map());
  const report = useCallback((id: string, state: SearchState) => {
    setReportedStates((prev) => {
      const next = new Map(prev);
      next.set(id, state);
      return next;
    });
  }, []);
  const unreport = useCallback((id: string) => {
    setReportedStates((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const rowAggregateValue = useMemo(() => ({ report, unreport }), [report, unreport]);

  const aggregateState =
    reportedStates.size > 0 ? computeAggregateState(Array.from(reportedStates.values())) : "initial";

  // Report up one level: a parent Column (acting exactly like a Row would) if nested,
  // otherwise the enclosing SearchViewer's aggregate context.
  const parentRowAggregate = React.useContext(RowAggregateContext);
  const searchViewerAggregate = React.useContext(SearchViewerAggregateContext);
  const upstreamReporter = parentRowAggregate ?? searchViewerAggregate;

  useEffect(() => {
    if (!upstreamReporter) return;
    upstreamReporter.report(columnId, aggregateState);
    return () => upstreamReporter.unreport(columnId);
  }, [upstreamReporter, columnId, aggregateState]);

  return (
    <RowAggregateContext.Provider value={rowAggregateValue}>
      <div
        className={className ? `search-viewer-column ${className}` : "search-viewer-column"}
        style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}
      >
        {children}
      </div>
    </RowAggregateContext.Provider>
  );
}

Column.displayName = "Column";

export { Column };
