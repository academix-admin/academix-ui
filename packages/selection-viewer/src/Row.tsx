import React, { useCallback, useEffect, useRef, useState } from "react";
import { RowAggregateContext } from "./SelectionViewer";
import type { SelectionState } from "./SelectionViewer";

export type RowProps = {
  id?: string;
  /** Consumer-owned — SelectionViewer has never owned fetch/filter state, so unlike
   *  search-viewer's Row this isn't internally computed. Mirrors how `selectionState`
   *  is already a prop on SelectionViewer itself today. Defaults to "data": if you
   *  render children without wiring this, we assume what you rendered IS the data. */
  state?: SelectionState;
  /** Called when this Row is scrolled horizontally near its end. Return (or resolve to)
   *  `true` if more data may follow (keeps the pagination trigger armed), `false` once
   *  there's nothing left to fetch — mirrors SelectionViewer's own `onPaginate` contract. */
  onPaginate?: () => boolean | Promise<boolean>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** A horizontally-scrolling, independently-paginating section — the Row/Column
 *  equivalent for `SelectionViewer`. No shared code with `@academix-admin/search-viewer`'s
 *  Row (Library Charter: packages stay mutually independent) — this one has no
 *  query/debounce/cache engine of its own since `SelectionViewer` never had one either;
 *  the consumer owns fetching/filtering and just tells this Row what `state` it's in. */
function Row({ id: providedId, state = "data", onPaginate, className, style, children }: RowProps) {
  const aggregateReporter = React.useContext(RowAggregateContext);
  const [rowId] = useState(() => providedId || `row-${Math.random().toString(36).substring(2, 11)}`);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPaginating = useRef(false);

  const handleScroll = useCallback(async () => {
    const el = containerRef.current;
    if (!el || isPaginating.current || !onPaginate) return;

    // Same "near the end" threshold as SelectionViewer's own vertical pagination trigger, adapted
    // to horizontal scroll metrics since a Row scrolls sideways.
    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollWidth - scrollLeft > clientWidth * 1.2) return;

    isPaginating.current = true;
    const hasMore = await onPaginate();
    if (!hasMore) {
      isPaginating.current = false;
    } else {
      setTimeout(() => {
        isPaginating.current = false;
      }, 500);
    }
  }, [onPaginate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onPaginate) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, onPaginate]);

  useEffect(() => {
    aggregateReporter?.report(rowId, state);
    return () => aggregateReporter?.unreport(rowId);
  }, [aggregateReporter, rowId, state]);

  return (
    <div
      ref={containerRef}
      className={className ? `selection-viewer-row ${className}` : "selection-viewer-row"}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "8px",
        overflowX: "auto",
        overflowY: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

Row.displayName = "Row";

export { Row };
