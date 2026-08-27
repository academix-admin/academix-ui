'use client';

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react';

// ─── SSR guard ────────────────────────────────────────────────────────────────

const IS_SSR = typeof window === 'undefined';
const useIsoLayoutEffect = IS_SSR ? useEffect : useLayoutEffect;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SheetDetent = 'default' | 'full' | 'content';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Controls height behaviour. default='content' */
  detent?: SheetDetent;
  /** Animation ease. default='easeOut' */
  ease?: string;
  /** Animation duration in seconds. default=0.22 */
  duration?: number;
  /** Velocity threshold to close on drag. default=500 */
  dragVelocityThreshold?: number;
  /** Fraction of height dragged before close. default=0.6 */
  dragCloseThreshold?: number;
  disableDrag?: boolean;
  disableDismiss?: boolean;
  avoidKeyboard?: boolean;
  mountPoint?: Element;
  style?: React.CSSProperties;
  /** Max height hint for initial positioning. Pass same value as Container maxHeight */
  maxHeight?: string | number;
  onOpenStart?: () => void;
  onOpenEnd?: () => void;
  onCloseStart?: () => void;
  onCloseEnd?: () => void;
}

export interface SheetContainerProps {
  children: React.ReactNode;
  /** Background colour. default='#fff' */
  backgroundColor?: string;
  /** Border radius on top corners. default='12px' */
  borderRadius?: string | number;
  /** Box shadow. default='0px -2px 16px rgba(0,0,0,0.3)' */
  boxShadow?: string;
  /** Max height of the sheet. default=undefined (library uses safe-area calc) */
  maxHeight?: string | number;
  /** Min height of the sheet. default=undefined */
  minHeight?: string | number;
  /** Max width of the sheet. default='500px' */
  maxWidth?: string | number;
  /** Extra bottom padding e.g. for safe area. default='env(safe-area-inset-bottom)' */
  paddingBottom?: string | number;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  [key: string]: any;
}

export interface SheetHeaderProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  disableDrag?: boolean;
}

export interface SheetContentProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  disableDrag?: boolean;
  disableScroll?: boolean;
  scrollStyle?: React.CSSProperties;
}

export interface SheetBackdropProps {
  /** Backdrop colour. default='rgba(0,0,0,0.4)' */
  backgroundColor?: string;
  /** Fade duration in seconds. default=0.2 */
  fadeDuration?: number;
  style?: React.CSSProperties;
  className?: string;
  onTap?: (e: any) => void;
  onClick?: (e: any) => void;
}

// ─── Internal context ─────────────────────────────────────────────────────────

interface SheetContextType {
  y: MotionValue<number>;
  detent: SheetDetent;
  disableDrag: boolean;
  dragProps: object;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  sheetBoundsRef: React.RefCallback<HTMLDivElement>;
  avoidKeyboard: boolean;
  /** Live visual viewport height — shrinks when keyboard is up */
  visualViewportHeight: number;
}

const SheetContext = createContext<SheetContextType | null>(null);

function useSheetContext() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('ModalSheetView: must be used inside <Sheet>');
  return ctx;
}

// ─── useMeasureHeight ─────────────────────────────────────────────────────────

function useMeasureHeight(): [React.RefCallback<HTMLDivElement>, number] {
  const [height, setHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref: React.RefCallback<HTMLDivElement> = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    const measure = () => {
      const borderH = node.getBoundingClientRect().height;
      setHeight(Math.round(borderH));
    };
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(node);
    measure();
  }, []);

  return [ref, height];
}

// ─── useWindowHeight ──────────────────────────────────────────────────────────

function useWindowHeight() {
  const [h, setH] = useState(() => (IS_SSR ? 800 : window.innerHeight));
  useIsoLayoutEffect(() => {
    const handler = () => setH(window.innerHeight);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return h;
}

// ─── useVisualViewportHeight ──────────────────────────────────────────────────
// Tracks the *visual* viewport height, which shrinks when the software keyboard
// appears. Falls back to window.innerHeight when the API is unavailable.

function useVisualViewportHeight() {
  const [h, setH] = useState(() =>
    IS_SSR ? 800 : (window.visualViewport?.height ?? window.innerHeight)
  );

  useIsoLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    /*
     * Thresholded, because iOS fires this continuously.
     *
     * `visualViewport` scroll fires on every frame that the page moves under a raised keyboard,
     * and each `setH` re-rendered the whole sheet subtree. Movement smaller than a few pixels is
     * not something a person can see, and re-rendering for it is how a sheet ends up janking on
     * the one platform whose keyboard animates.
     */
    const handler = () => {
      const next = vv.height;
      setH((prev) => (Math.abs(prev - next) > 4 ? next : prev));
    };
    handler();
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  return h;
}

// ─── usePreventScroll ─────────────────────────────────────────────────────────

function usePreventScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [isOpen]);
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

type SheetState = 'closed' | 'opening' | 'open' | 'closing';

const SheetBase = forwardRef<any, SheetProps>(({
  isOpen,
  onClose,
  children,
  detent = 'content',
  ease = 'easeOut',
  duration = 0.22,
  dragVelocityThreshold = 500,
  dragCloseThreshold = 0.6,
  disableDrag: disableDragProp = false,
  disableDismiss = false,
  avoidKeyboard = true,
  mountPoint,
  style,
  maxHeight,
  onOpenStart,
  onOpenEnd,
  onCloseStart,
  onCloseEnd,
}, ref) => {
  const [sheetBoundsRef, sheetHeight] = useMeasureHeight();
  const sheetRef = useRef<HTMLDivElement>(null);
  const windowHeight = useWindowHeight();
  const visualViewportHeight = useVisualViewportHeight();

  // Calculate effective max height immediately
  const effectiveMaxHeight = React.useMemo(() => {
    if (!maxHeight) return windowHeight;
    if (typeof maxHeight === 'number') return maxHeight;
    if (typeof maxHeight === 'string' && maxHeight.includes('dvh')) {
      const dvhValue = parseFloat(maxHeight);
      return (windowHeight * dvhValue) / 100;
    }
    if (typeof maxHeight === 'string' && maxHeight.includes('vh')) {
      const vhValue = parseFloat(maxHeight);
      return (windowHeight * vhValue) / 100;
    }
    return windowHeight;
  }, [maxHeight, windowHeight]);

  const y = useMotionValue(effectiveMaxHeight);
  const [state, setState] = useState<SheetState>(isOpen ? 'opening' : 'closed');
  const [visible, setVisible] = useState(isOpen);

  const animOpts = { ease, duration };

  // State machine transitions
  useEffect(() => {
    if (isOpen && state === 'closed') {
      setVisible(true);          // mount children
      setState('opening');       // will animate once height is measured
    } else if (!isOpen && (state === 'open' || state === 'opening')) {
      setState('closing');
    }
  }, [isOpen]);

  /*
   * Start the open animation ONCE per open — not every time the sheet is re-measured.
   *
   * This effect depends on `sheetHeight`, which a ResizeObserver updates whenever the sheet's
   * content changes size. It used to re-run on every one of those, and each run did
   * `y.set(effectiveMaxHeight)` — teleporting the sheet back down to the bottom — before animating
   * it up again. Two transforms read `y` and both treat "at the bottom" as gone: `zIndex` returns
   * -1 and `opacity` returns 0. So every re-measure made the sheet VANISH for a frame and then
   * slide back up.
   *
   * On a sheet holding a text field that is continuous. The soft keyboard changes the content
   * height, and each change re-triggered the teleport; because every re-animate also restarted the
   * 0.25s timer, `state` never reached 'open', so the guard above never stopped firing. iOS is
   * where it was reported and iOS is where it is worst — its keyboard produces a stream of
   * intermediate `visualViewport` sizes, where Android resizes once — but the fault is not
   * platform-specific, it is just harder to see when the height settles quickly.
   *
   * What a person saw: a sheet that flickered, sat at a different height every frame, and looked
   * like it had closed itself while they were typing into it.
   *
   * The ref records that this open cycle has already begun animating. Later height changes still
   * resize the sheet — that is the ResizeObserver's job and it still works — they just no longer
   * restart the entrance.
   */
  const openAnimationStarted = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Wait for the height to SETTLE, then animate once, straight to it.
   *
   * Starting on the first non-zero measurement is too early. A sheet's first measured height is
   * whatever its content happens to be at that instant — before a font swaps, before an image gets
   * its box, before the first data arrives — so the sheet slid up to one height and then resized
   * to another. The entrance was correct; the destination was a guess.
   *
   * So a height change while still `opening` restarts a short timer, and the entrance begins only
   * once the measurement has held still for a couple of frames. `y` stays parked at the bottom
   * meanwhile, which is exactly where a sheet that has not opened yet should be — nothing is
   * visible until the slide starts, so the wait costs an imperceptible delay and buys an entrance
   * that lands on the right height first time.
   */
  useEffect(() => {
    if (state !== 'opening' || sheetHeight <= 0) return;
    if (openAnimationStarted.current) return;

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (openAnimationStarted.current) return;
      openAnimationStarted.current = true;

      onOpenStart?.();
      y.set(effectiveMaxHeight);
      (animate as any)(y, 0, {
        ...animOpts,
        onComplete: () => { setState('open'); onOpenEnd?.(); },
      });
    }, 32);

    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [state, sheetHeight, effectiveMaxHeight]);

  // Armed again for the next open. Reset on 'closed' rather than on `isOpen` flipping, so a sheet
  // reopened before its close animation finished still gets a clean entrance.
  useEffect(() => {
    if (state === 'closed') {
      openAnimationStarted.current = false;
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
    }
  }, [state]);

  /*
   * Same guard on the way out.
   *
   * Closing a sheet dismisses the keyboard, which changes the height, which re-ran this effect and
   * restarted the slide-out from the top — so a sheet with a focused field appeared to bounce
   * before it left.
   */
  const closeAnimationStarted = useRef(false);

  useEffect(() => {
    if (state !== 'closing') {
      if (state === 'open' || state === 'opening') closeAnimationStarted.current = false;
      return;
    }
    if (closeAnimationStarted.current) return;
    closeAnimationStarted.current = true;

    onCloseStart?.();
    const closeY = sheetHeight > 0 ? sheetHeight : effectiveMaxHeight;
    (animate as any)(y, closeY, {
      ...animOpts,
      onComplete: () => {
        setState('closed');
        setVisible(false);
        onCloseEnd?.();
      },
    });
  }, [state, sheetHeight, effectiveMaxHeight]);

  const onDrag = useCallback((_: any, info: any) => {
    y.set(Math.max(y.get() + info.delta.y, 0));
  }, [y]);

  const onDragEnd = useCallback((_: any, info: any) => {
    const closeY = sheetHeight > 0 ? sheetHeight : effectiveMaxHeight;
    const shouldClose = !disableDismiss && (
      info.velocity.y > dragVelocityThreshold ||
      y.get() > closeY * dragCloseThreshold
    );
    if (shouldClose) {
      (animate as any)(y, closeY, animOpts);
      onClose();
    } else {
      (animate as any)(y, 0, animOpts);
    }
  }, [y, sheetHeight, effectiveMaxHeight, disableDismiss, dragVelocityThreshold, dragCloseThreshold, onClose, animOpts]);

  const dragProps = disableDragProp ? {} : {
    drag: 'y' as const,
    dragElastic: 0,
    dragMomentum: false,
    dragPropagation: false,
    onDrag,
    onDragEnd,
  };

  useImperativeHandle(ref, () => ({ y, height: sheetHeight }));
  usePreventScroll(isOpen);

  const zIndex = useTransform(y, (val) => {
    const effectiveHeight = sheetHeight || effectiveMaxHeight;
    return val + 2 >= effectiveHeight ? -1 : (style?.zIndex as number ?? 9999);
  });
  const opacity = useTransform(y, (val) => {
    if (state === 'opening' && val >= effectiveMaxHeight * 0.95) return 0;
    const effectiveHeight = sheetHeight || effectiveMaxHeight;
    return val + 2 >= effectiveHeight ? 0 : 1;
  });

  const context: SheetContextType = {
    y, detent, disableDrag: disableDragProp, dragProps,
    sheetRef, sheetBoundsRef, avoidKeyboard,
    visualViewportHeight,
  };

  const sheet = (
    <SheetContext.Provider value={context}>
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex,
          opacity,
          ...style,
        }}
      >
        {visible ? children : null}
      </motion.div>
    </SheetContext.Provider>
  );

  if (IS_SSR) return sheet;
  return createPortal(sheet, mountPoint ?? document.body);
});

SheetBase.displayName = 'Sheet';

// ─── Sheet.Container ──────────────────────────────────────────────────────────

const SheetContainer = forwardRef<any, SheetContainerProps>(({
  children,
  backgroundColor = '#fff',
  borderRadius = '12px',
  boxShadow = '0px -2px 16px rgba(0,0,0,0.3)',
  maxHeight,
  minHeight,
  maxWidth = '500px',
  paddingBottom = 'env(safe-area-inset-bottom)',
  style,
  className = '',
  id,
  ...rest
}, ref) => {
  const { y, detent, sheetRef, sheetBoundsRef, visualViewportHeight } = useSheetContext();

  const containerStyle: MotionStyle = {
    zIndex: 2,
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    maxWidth,
    margin: '0 auto',
    right: 0,
    pointerEvents: 'auto',
    // ── KEY: flex column so header stays fixed and content fills remaining space
    display: 'flex',
    flexDirection: 'column',
    backgroundColor,
    borderTopRightRadius: borderRadius,
    borderTopLeftRadius: borderRadius,
    boxShadow,
    paddingBottom,
    y,
    ...style,
  };

  /*
   * Never taller than what is actually on screen.
   *
   * `visualViewportHeight` was computed, put on the context and then read by nobody, so a sheet
   * sized in `dvh` kept its full height when the keyboard came up — and `dvh` is the LAYOUT
   * viewport, which does not shrink for a keyboard. A 92dvh sheet on a phone with a keyboard up is
   * taller than the visible area, so its top — the title, the close button, the drag handle — sat
   * off the top of the screen, out of reach.
   *
   * Capping to the visual viewport is what keeps the top of the sheet in view. It does nothing at
   * all when no keyboard is up, because then the two viewports are the same size.
   */
  const viewportCap =
    visualViewportHeight > 0 ? `${Math.round(visualViewportHeight)}px` : null;
  const capped = (value: string | number | undefined) => {
    if (!viewportCap) return value;
    if (value === undefined) return viewportCap;
    return `min(${typeof value === 'number' ? `${value}px` : value}, ${viewportCap})`;
  };

  // Apply height based on detent
  if (detent === 'default') {
    containerStyle.height = 'calc(100% - env(safe-area-inset-top) - 34px)';
    containerStyle.maxHeight = capped(undefined);
  } else if (detent === 'full') {
    containerStyle.height = '100%';
    containerStyle.maxHeight = capped('100%');
  } else {
    containerStyle.height = 'auto';
    containerStyle.maxHeight = capped(maxHeight);
    if (minHeight) {
      // The floor is capped too. A `minHeight` taller than the visible area would push the top off
      // screen just as surely as a `maxHeight` would, and a floor that cannot be honoured is not a
      // floor.
      containerStyle.minHeight = capped(minHeight);
    }
  }

  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    sheetBoundsRef(node);
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<any>).current = node;
  }, [sheetRef, sheetBoundsRef, ref]);

  // ── Block scroll bleed-through ────────────────────────────────────────────
  // React synthetic onTouchMove cannot call preventDefault() because React
  // registers its listeners as passive. We need a native non-passive listener
  // on the container so we can preventDefault() when the touched scrollable
  // child has no more room to scroll — preventing the browser from scrolling
  // whatever sits behind the sheet.
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      // Walk up from the touch target to find the nearest scrollable ancestor
      // inside our container.
      let target = e.target as HTMLElement | null;
      let scrollable: HTMLElement | null = null;

      while (target && target !== el) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        const canScroll = overflowY === 'auto' || overflowY === 'scroll';
        if (canScroll && target.scrollHeight > target.clientHeight) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      if (!scrollable) {
        // No scrollable child found — block the event entirely so it cannot
        // reach content beneath the sheet.
        e.preventDefault();
        return;
      }

      // A scrollable child exists. Only block if it has hit its scroll boundary
      // (top or bottom), otherwise let the child scroll naturally.
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const touch = e.touches[0];
      // We need the direction; store the last Y on the element itself.
      const lastY = (scrollable as any).__lastTouchY ?? touch.clientY;
      const dy = touch.clientY - lastY;
      (scrollable as any).__lastTouchY = touch.clientY;

      const atTop = scrollTop <= 0 && dy > 0;       // pulling down at top
      const atBottom = scrollTop + clientHeight >= scrollHeight && dy < 0; // pulling up at bottom

      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      // Reset stored Y on every new touch
      let target = e.target as HTMLElement | null;
      while (target && target !== el) {
        (target as any).__lastTouchY = e.touches[0].clientY;
        target = target.parentElement;
      }
    };

    // { passive: false } is required — without it preventDefault() is ignored.
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  const assignContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    mergedRef(node);
  }, [mergedRef]);

  return (
    <motion.div
      {...rest}
      id={id}
      ref={assignContainerRef}
      className={`react-modal-sheet-container ${className}`}
      style={containerStyle}
    >
      {children}
    </motion.div>
  );
});

SheetContainer.displayName = 'SheetContainer';

// ─── Sheet.Header ─────────────────────────────────────────────────────────────

const SheetHeader = forwardRef<any, SheetHeaderProps>(({
  children, style, className = '', disableDrag,
}, ref) => {
  const { dragProps, disableDrag: ctxDisableDrag } = useSheetContext();
  const activeDragProps = (disableDrag || ctxDisableDrag) ? {} : dragProps;

  return (
    <motion.div
      ref={ref}
      className={`react-modal-sheet-header-container ${className}`}
      style={{
        width: '100%',
        // ── Header must never shrink — it's the pinned element
        flexShrink: 0,
        ...style,
      }}
      {...activeDragProps}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
    >
      {children ?? (
        <div style={{
          width: '100%', height: '40px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '36px', height: '4px', borderRadius: '99px', backgroundColor: '#ddd',
          }} />
        </div>
      )}
    </motion.div>
  );
});

SheetHeader.displayName = 'SheetHeader';

// ─── Sheet.Content ────────────────────────────────────────────────────────────

const SheetContent = forwardRef<any, SheetContentProps>(({
  children, style, className = '', disableDrag, disableScroll, scrollStyle,
}, ref) => {
  const { dragProps, disableDrag: ctxDisableDrag, avoidKeyboard } = useSheetContext();
  const activeDragProps = (disableDrag || ctxDisableDrag) ? {} : dragProps;

  return (
    <motion.div
      ref={ref}
      className={`react-modal-sheet-content ${className}`}
      style={{
        // ── Content fills all remaining vertical space after the header.
        // min-height:0 is required for flex children to shrink below their
        // intrinsic size, which is what allows the inner scroller to work.
        minHeight: 0,
        flexGrow: 1,
        // overflow:hidden here — the inner scroller div handles scrolling.
        // Without this the *container* would grow and push the header off-screen.
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...activeDragProps}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
    >
      <div
        className="react-modal-sheet-content-scroller"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: disableScroll ? 'hidden' : 'auto',
          overscrollBehaviorY: 'none',
          ...(avoidKeyboard ? {
            paddingBottom: 'env(keyboard-inset-height, var(--keyboard-inset-height, 0px))',
          } : {}),
          ...scrollStyle,
        }}

      >
        {children}
      </div>
    </motion.div>
  );
});

SheetContent.displayName = 'SheetContent';

// ─── Sheet.Backdrop ───────────────────────────────────────────────────────────

const SheetBackdrop = forwardRef<any, SheetBackdropProps>(({
  backgroundColor = 'rgba(0,0,0,0.4)',
  fadeDuration = 0.2,
  style, className = '', onTap, onClick,
}, ref) => {
  const isClickable = !!(onTap || onClick);
  const Comp = isClickable ? motion.button : motion.div;

  return (
    <Comp
      ref={ref as any}
      className={`react-modal-sheet-backdrop ${className}`}
      style={{
        zIndex: 1,
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        // Always block touch/scroll — even when not tappable the backdrop
        // must prevent scroll events leaking through to content behind the sheet.
        touchAction: 'none',
        userSelect: 'none',
        backgroundColor,
        border: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Always 'auto' so the element receives and swallows pointer/touch events.
        // Previously 'none' when not clickable caused scroll bleed-through.
        pointerEvents: 'auto',
        cursor: isClickable ? 'pointer' : 'default',
        ...style,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      /*
       * Stops taking pointer events the moment it starts fading, not when the fade ends.
       *
       * The backdrop swallows events on purpose while the sheet is up. On the way out it kept doing
       * so for the whole `fadeDuration`, invisibly: a tap aimed at the page a fraction of a second
       * after the sheet closed landed on a backdrop that was almost transparent and on its way to
       * being unmounted. It looked like the app dropping taps at random, and it is why an automated
       * run would fail on one pass and pass on the next with nothing changed.
       */
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: fadeDuration }}
      onTap={onTap as any}
      onClick={onClick}
      // Swallow wheel and touch scroll events so they cannot reach content below
      onWheel={(e: React.WheelEvent) => e.stopPropagation()}
      onTouchMove={(e: React.TouchEvent) => e.stopPropagation()}
    />
  );
});

SheetBackdrop.displayName = 'SheetBackdrop';

// ─── Compound export ──────────────────────────────────────────────────────────

type SheetCompound = typeof SheetBase & {
  Container: typeof SheetContainer;
  Header: typeof SheetHeader;
  Content: typeof SheetContent;
  Backdrop: typeof SheetBackdrop;
};

const Sheet = SheetBase as SheetCompound;
Sheet.Container = SheetContainer;
Sheet.Header = SheetHeader;
Sheet.Content = SheetContent;
Sheet.Backdrop = SheetBackdrop;

export { Sheet };
export default Sheet;