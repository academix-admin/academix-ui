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

export type AppBarBehavior = 'pinned' | 'scroll';

export interface ScaffoldProps {
  /** Top bar (e.g. a `<Header position="static" />`). Pinned unless `appBarBehavior` says otherwise. */
  appBar?: React.ReactNode;
  /**
   * How the app bar behaves as the body scrolls.
   *
   * - `'pinned'` (default) — it stays. Right for a screen you read, where the title is a
   *   permanent label for what you are looking at.
   * - `'scroll'` — it travels with the content, one-to-one, and comes back as you scroll up.
   *   Right for a screen with its own sticky furniture beneath it: a toolbar or filter row cannot
   *   take the top of the screen while a pinned bar is already standing there.
   *
   * The bar is laid OVER the body rather than removed from the column, and the body is padded by
   * its height — so nothing jumps at the moment the behaviour takes effect, and content genuinely
   * passes underneath it instead of being clipped short.
   */
  appBarBehavior?: AppBarBehavior;
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
  appBarBehavior = 'pinned',
  bottomBar,
  children,
  scroll = true,
  bodyClassName,
  bodyStyle,
}: ScaffoldProps) {
  /*
   * A travelling bar is simply the first thing in the scroll body.
   *
   * It scrolls because it IS content — which is the smoothest possible version of this, and the
   * only one that cannot drift out of step with the page. The finger moves the page; the bar is on
   * the page.
   *
   * An earlier attempt laid the bar over the body with a transform driven by a scroll listener.
   * That worked visually and was wrong in two ways that matter. It needed a wrapper element, and
   * the wrapper stopped ColumnBody being a direct child of the page — which is how this stack
   * identifies the scroll container, so anything subscribing to page scroll (a bottom bar that
   * autohides, a floating action that steps aside for it) went silent. And measuring the bar to
   * reserve its space meant a ResizeObserver writing a fractional height back into the layout it
   * was measuring, which never settles.
   *
   * Structure unchanged, no measuring, no listener: the bar moves at exactly the speed of the
   * page, and a `position: sticky` element after it still pins to the top of the scrollport once
   * the bar has gone.
   */
  const travels = appBarBehavior === 'scroll' && appBar != null && scroll;

  return (
    <>
      {appBar != null && !travels && (
        <div className="navstack-scaffold__bar" style={{ flex: '0 0 auto', position: 'relative', zIndex: 2 }}>
          {appBar}
        </div>
      )}
      {scroll ? (
        <ColumnBody className={bodyClassName} style={bodyStyle}>
          {travels && (
            <div className="navstack-scaffold__bar navstack-scaffold__bar--travels" style={{ flex: '0 0 auto' }}>
              {appBar}
            </div>
          )}
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
