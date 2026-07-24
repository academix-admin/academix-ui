'use client';

import React, { useContext, useEffect, useRef } from 'react';
import { PageBodyContext } from './core/contexts';

/**
 * ColumnBody / RowBody — the single, keyboard-safe scroll region for a page
 * (Flutter's SingleChildScrollView + Column/Row).
 *
 * A page composed as:
 *
 *   <>
 *     <Header ... position="static" />   // pinned bar (flex-none sibling)
 *     <ColumnBody>...content...</ColumnBody>
 *   </>
 *
 * tells its NavigationStack page wrapper (via PageBodyContext) to become a
 * keyboard-aware flex column instead of a scroller. The header (and any bottom
 * bar) then sit OUTSIDE the scroll region and stay pinned, while the body scrolls
 * under them — with no `position: fixed` (so it survives page-transition
 * transforms) and no nested/double scroll. The wrapper reserves
 * `--ax-keyboard-inset` so the body ends above the on-screen keyboard. The claimed
 * body is also the element NavigationStack saves/restores scroll for.
 *
 * Pages that don't use ColumnBody/RowBody render exactly as before (the wrapper
 * stays the scroller) — this is fully additive.
 */

export interface BodyProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

function useClaimScroll(ref: React.RefObject<HTMLElement | null>) {
  const ctx = useContext(PageBodyContext);
  useEffect(() => {
    if (!ctx || !ref.current) return;
    ctx.claimScroll(ref.current);
    return () => ctx.claimScroll(null);
    // ctx identity is stable per page; ref.current is set before effects run.
  }, [ctx]);
}

/** Vertical scroll region (default page body). */
export function ColumnBody({ children, className, style, id }: BodyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useClaimScroll(ref);
  return (
    <div
      ref={ref}
      id={id}
      className={`navstack-column-body ${className ?? ''}`.trim()}
      style={{
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Horizontal scroll region. */
export function RowBody({ children, className, style, id }: BodyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useClaimScroll(ref);
  return (
    <div
      ref={ref}
      id={id}
      className={`navstack-row-body ${className ?? ''}`.trim()}
      style={{
        flex: '1 1 auto',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface ScaffoldProps {
  /** Pinned top bar (e.g. a `<Header position="static" />`). Never scrolls. */
  appBar?: React.ReactNode;
  /** Pinned bottom bar (rides above the keyboard). Never scrolls. */
  bottomBar?: React.ReactNode;
  /** Page body. Wrapped in a ColumnBody scroll region unless `scroll={false}`. */
  children?: React.ReactNode;
  /** Wrap `children` in a ColumnBody (default true). Set false to supply your own
   *  ColumnBody/RowBody (e.g. a horizontal body). */
  scroll?: boolean;
  /** Class on the scroll body — put the page's theme-variant class here so its
   *  CSS custom properties are in scope for the content. */
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
}

/**
 * Scaffold — the ergonomic page shell (Flutter's `Scaffold`), built on ColumnBody.
 *
 *   <Scaffold appBar={<Header .../>} bottomBar={<Actions/>}>
 *     ...content...
 *   </Scaffold>
 *
 * Renders the appBar + scroll body + bottomBar as direct flex children of the
 * NavigationStack page wrapper. The body's ColumnBody claims the scroll, so the
 * wrapper becomes a keyboard-aware flex column: appBar and bottomBar stay pinned
 * (bottomBar rides above the keyboard) while the body scrolls under them. Fully
 * opt-in — pages that don't use Scaffold/ColumnBody are unaffected.
 */
export function Scaffold({
  appBar,
  bottomBar,
  children,
  scroll = true,
  bodyClassName,
  bodyStyle,
}: ScaffoldProps) {
  return (
    <>
      {appBar != null && (
        <div className="navstack-scaffold__bar" style={{ flex: '0 0 auto', position: 'relative', zIndex: 2 }}>
          {appBar}
        </div>
      )}
      {scroll ? (
        <ColumnBody className={bodyClassName} style={bodyStyle}>
          {children}
        </ColumnBody>
      ) : (
        children
      )}
      {bottomBar != null && (
        <div className="navstack-scaffold__bottom" style={{ flex: '0 0 auto', position: 'relative', zIndex: 2 }}>
          {bottomBar}
        </div>
      )}
    </>
  );
}
