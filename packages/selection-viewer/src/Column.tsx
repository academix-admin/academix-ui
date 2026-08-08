import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RowAggregateContext, SelectionViewerAggregateContext, computeAggregateState } from "./SelectionViewer";
import type { SelectionState } from "./SelectionViewer";

export type ColumnProps = {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** A vertical arrangement of `Row`s (or other content) — the explicit, composable
 *  equivalent of today's flat `children` list. Its default layout is deliberately
 *  identical to the existing `.selection-viewer-content.vertical` rendering
 *  (`flex-direction: column, gap: 8px`), so today's flat usage is, unchanged, "an
 *  implicit Column with no Rows."
 *
 *  Provides the `RowAggregateContext` its `Row` children report into, computes ONE
 *  cumulative state from everything reported, and is itself a reporter one level up:
 *  nested inside another `Column` it reports through that Column's `RowAggregateContext`
 *  (behaving like a Row); at the top level it reports through `SelectionViewerAggregateContext`,
 *  which `SelectionViewer` provides — this drives the outer sheet's loading/empty/error
 *  views automatically with zero manual wiring, and lets Columns nest arbitrarily deep. */
function Column({ id: providedId, className, style, children }: ColumnProps) {
  const [columnId] = useState(
    () => providedId || `column-${Math.random().toString(36).substring(2, 11)}`
  );

  const [reportedStates, setReportedStates] = useState<Map<string, SelectionState>>(new Map());
  const report = useCallback((id: string, state: SelectionState) => {
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

  const parentRowAggregate = React.useContext(RowAggregateContext);
  const selectionViewerAggregate = React.useContext(SelectionViewerAggregateContext);
  const upstreamReporter = parentRowAggregate ?? selectionViewerAggregate;

  useEffect(() => {
    if (!upstreamReporter) return;
    upstreamReporter.report(columnId, aggregateState);
    return () => upstreamReporter.unreport(columnId);
  }, [upstreamReporter, columnId, aggregateState]);

  return (
    <RowAggregateContext.Provider value={rowAggregateValue}>
      <div
        className={className ? `selection-viewer-column ${className}` : "selection-viewer-column"}
        style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}
      >
        {children}
      </div>
    </RowAggregateContext.Provider>
  );
}

Column.displayName = "Column";

export { Column };
