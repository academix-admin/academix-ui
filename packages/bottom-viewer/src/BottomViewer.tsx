import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sheet } from "@academix-admin/modal-sheet";
import { useOverlayRoute } from '@academix-admin/overlay-route';

// ==================== Types ====================
interface LayoutProps {
  backgroundColor?: string;
  handleColor?: string;
  handleWidth?: string;
  maxHeight?: string;
  /** Height the sheet opens at before its content is measured. Stops the open-and-jump. */
  minHeight?: string;
  maxWidth?: string;
}

interface CancelButtonProps {
  text?: string;
  view?: React.ReactNode;
  position?: "left" | "right";
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface BottomViewerProps {
  id?: string;
  isOpen: boolean;
  /**
   * DOM element to portal the sheet into. Defaults to `document.body`.
   *
   * Exists so a host that owns its own overlay layer can keep the sheet inside that layer instead
   * of at the document root — e.g. a navigation library's group-level overlay host, which stays
   * mounted across tab switches. This component knows nothing about any such host; it just takes
   * an element and passes it to the underlying sheet.
   */
  mountPoint?: Element;
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
  cancelButton?: CancelButtonProps;
  layoutProp?: LayoutProps;
  children?: React.ReactNode;
  unmountOnClose?: boolean;
  zIndex?: number;
  detent?: "content" | "full";
  disableDrag?: boolean;
  avoidKeyboard?: boolean;
  closeThreshold?: number;
  /**
   * Accessible name for the sheet, announced when it opens.
   *
   * A modal with no name is announced simply as "dialog", which tells a screen-reader user that
   * something has taken over the screen and nothing at all about what.
   */
  ariaLabel?: string;
}

// ==================== Styles ====================
const getStyles = (id: string) => `
#${id} .bottom-viewer-drag-handle {
  height: 5px;
  border-radius: 3px;
  margin: 16px auto;
  cursor: grab;
}
#${id} .bottom-viewer-drag-handle:active {
  cursor: grabbing;
}
#${id} .bottom-viewer-header {
  padding: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  flex-shrink: 0;
}
#${id} .bottom-viewer-content {
  overflow-y: auto;
  padding: 0 0px 0px 0px;
  -webkit-overflow-scrolling: touch;
}
#${id} .bottom-viewer-cancel-btn {
  position: absolute;
  top: 8px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  padding: 8px 16px;
  font-size: 16px;
  color: #007AFF;
  z-index: 1;
  min-height: 44px;
}
#${id} .bottom-viewer-cancel-btn:hover { opacity: 0.7; }
#${id} .bottom-viewer-cancel-btn.left { left: 0px; }
#${id} .bottom-viewer-cancel-btn.right { right: 0px; }
#${id} {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}
#${id} .react-modal-sheet-backdrop {
  background-color: rgba(0, 0, 0, 0.5) !important;
  pointer-events: auto !important;
}
#${id} .react-modal-sheet-content {
  padding: 0;
  height: 100%;
}
@media (max-width: 500px) {
  #${id} {
    border-radius: 0;
  }
}
#${id} .body-bottom-sheet-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
#${id} .bottom-viewer-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #666;
}
`;

// ==================== Hook to inject CSS per instance ====================
const useInjectStyles = (id: string) => {
  useEffect(() => {
    const styleId = `bottom-viewer-styles-${id}`;
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
  }, [id]);
};

// ==================== BottomViewer Component ====================
const BottomViewer = React.forwardRef<any, BottomViewerProps>(({
  id: providedId,
  isOpen,
  historyRoute,
  mountPoint,
  backDrop = true,
  onClose,
  cancelButton,
  layoutProp,
  children,
  unmountOnClose = false,
  zIndex = 1000,
  detent = "content",
  disableDrag = false,
  avoidKeyboard = true,
  ariaLabel,
  closeThreshold = 0.2,
}, ref) => {

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
  const [id] = useState(() => providedId || `bottomviewer-${Math.random().toString(36).substr(2, 9)}`);
  const sheetRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  /*
   * `onClose`, reachable without being a dependency.
   *
   * Consumers pass an inline arrow, so its identity changes on every render. Anything that lists
   * it in a dependency array therefore re-runs on every render — which is how the focus timer
   * above came to fire after every keystroke.
   */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const initialChildrenRef = useRef<React.ReactNode>(children);
  const [currentContent, setCurrentContent] = useState<React.ReactNode>(children);

  useInjectStyles(id);

  const isControlledInternally = useRef(false);

  useEffect(() => {
    if (!isControlledInternally.current) {
      setCurrentContent(children);
      initialChildrenRef.current = children;
    }
  }, [children]);

  /*
   * How much of the screen the on-screen keyboard is covering.
   *
   * `visualViewport.height` shrinks when the keyboard opens; the difference is what the keyboard
   * has taken. Without this the sheet keeps its full height, the keyboard is drawn over the bottom
   * of it, and the field being typed into is underneath — which is the single most common way a
   * mobile form becomes unusable.
   */
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vp = window.visualViewport;

    const onResize = () => {
      /*
       * `innerHeight - vp.height`, WITHOUT `offsetTop`.
       *
       * `offsetTop` is how far the visual viewport has been scrolled within the layout viewport,
       * which on iOS changes continuously while the page moves under a raised keyboard. Folding it
       * in here meant this value changed on every scroll frame, and since it feeds the content's
       * `paddingBottom`, the sheet was re-measured on every one of those frames. That is the same
       * measurement storm the sheet's entrance animation used to restart on.
       *
       * The keyboard's height is a property of the keyboard, not of how far the page has scrolled.
       * search-viewer and selection-viewer have always computed it this way.
       */
      const next = Math.max(0, Math.round(window.innerHeight - vp.height));

      // Ignore sub-threshold movement. iOS reports a stream of intermediate heights as the
      // keyboard animates, and re-rendering on each one buys nothing a person can see.
      setKeyboardHeight((prev) => (Math.abs(prev - next) > 8 ? next : prev));
    };

    onResize();
    vp.addEventListener('resize', onResize);
    vp.addEventListener('scroll', onResize);
    return () => {
      vp.removeEventListener('resize', onResize);
      vp.removeEventListener('scroll', onResize);
    };
  }, []);

  /*
   * THERE IS NO `fieldFocused` HERE ANY MORE, AND THAT IS THE POINT.
   *
   * This component used to watch focusin/focusout and, when a field was focused, flip `detent` to
   * 'full', raise `minHeight` to 92dvh and turn dragging off. Every one of those changes the
   * sheet's height, and it changed them at the exact moment the keyboard was also changing it —
   * so the sheet stretched to the screen, snapped back to its content, and shifted again as focus
   * moved between fields. On a form with an autofocused field it did all of that during the
   * entrance.
   *
   * search-viewer, which is stable while you type, has nothing of the kind: `detent="content"`,
   * `minHeight: "100%"`, and no notion of focus at all. Its height is decided once and never
   * reconsidered. That is the property that matters — not how cleverly the height is recomputed,
   * but that it is NOT recomputed.
   *
   * The two things focus was being used for are handled properly instead:
   *
   *   Keeping a focused field clear of the keyboard is the CONTENT's job, by padding its scroller
   *   with the keyboard's height (below) and letting the browser scroll the field into view. It
   *   never needed the whole sheet to grow.
   *
   *   Stopping a touch on a field from dismissing the sheet is done by not making the content a
   *   drag surface in the first place — see `Sheet.Content` below.
   */

  /*
   * A `--vh` custom property used to be published here on every viewport resize AND scroll.
   *
   * Nothing read it — not this package, not the other viewers, not any consumer. What it did do
   * was write to `document.documentElement.style` on every one of those events, which invalidates
   * style for the whole document. On iOS, where `visualViewport` scroll fires continuously while a
   * keyboard is up, that is a document-wide recalculation per frame, paid for nothing.
   *
   * Removed rather than kept "just in case": an unused global write is not a feature, and a sheet
   * has no business setting a property on the root element of somebody else's page.
   */

  const getMaxWidth = useCallback(() => {
    return layoutProp?.maxWidth || '500px';
  }, [layoutProp?.maxWidth]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.classList.add('body-bottom-sheet-open');
    } else {
      document.body.classList.remove('body-bottom-sheet-open');
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
      isControlledInternally.current = false;
    }
    return () => {
      document.body.classList.remove('body-bottom-sheet-open');
    };
  }, [isOpen]);

  /*
   * Escape closes it, and Tab stays inside it.
   *
   * Neither was here. A sheet without them is one a keyboard or screen-reader user can tab
   * straight out of — into controls they cannot see behind the backdrop — with no way to dismiss
   * what is covering the screen except a pointer. On a surface that takes payments that is not an
   * acceptable gap, and without it every consumer has to rebuild the same thing; store-manager
   * had, in a hand-rolled sheet that existed only because of this.
   *
   * The trap re-queries on each Tab rather than caching the focusable list: a sheet's content
   * changes while it is open — a list loads, a form reveals a field — and a cached list sends
   * focus to an element that is no longer there.
   */
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    /*
     * NOTHING FOCUSES THE CONTAINER, AND THAT IS DELIBERATE.
     *
     * There used to be a `setTimeout(() => containerRef.current.focus(), 60)` here, to announce the
     * sheet to a screen reader on arrival. It was the cause of "typing closes the bottom viewer":
     * the effect listed `onClose` in its dependencies, every consumer passes that as an inline
     * arrow, so the effect tore down and re-ran on every render — and 60ms after each keystroke the
     * timer moved focus off the input onto this div. Typing "First Bank" left "F" in the field and
     * `document.activeElement` on a DIV.
     *
     * A ref would have stopped the re-runs, but the right question is whether the focus call earns
     * its place at all. search-viewer and selection-viewer — the two that have always been stable
     * while typing — never focus their container; they set `role="dialog"`, `aria-modal` and an
     * `aria-label` and leave focus alone. That is enough: the dialog is announced when focus enters
     * it, and where a sheet wants a particular field first, `autoFocus` on that field says so
     * exactly.
     *
     * So this matches them. The Escape handler and focus trap below stay — those are the parts
     * `useModalKeys` gives the other two.
     */

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
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

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleBackdropTap = useCallback((event: any) => {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (backDrop) onClose();
  }, [backDrop, onClose]);

  const handleCancelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (cancelButton?.onClick) cancelButton.onClick();
    else onClose();
  }, [cancelButton, onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains("bottom-viewer-container")) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  React.useImperativeHandle(ref, () => ({
    updateContent: (content: React.ReactNode) => {
      isControlledInternally.current = true;
      setCurrentContent(content);
    },
    replaceContent: (content: React.ReactNode) => {
      isControlledInternally.current = true;
      setCurrentContent(content);
    },
    clearContent: () => {
      isControlledInternally.current = true;
      setCurrentContent(null);
    },
    resetContent: () => {
      isControlledInternally.current = false;
      setCurrentContent(initialChildrenRef.current);
    },
    isEventFromSheet: (event: React.MouseEvent | MouseEvent) => {
      const target = event.target as HTMLElement;
      return !!(
        target.closest('.react-modal-sheet-container') ||
        target.closest('.react-modal-sheet-backdrop') ||
        target.closest('.bottom-viewer-container')
      );
    }
  }));

  return (
    <Sheet
      ref={sheetRef}
      isOpen={isOpen}
      onClose={onClose}
      mountPoint={mountPoint}
      /*
       * The PROP, unchanged for as long as the sheet is open.
       *
       * `detent` was originally accepted, documented and then ignored — every sheet was
       * content-sized whatever the consumer asked for. Passing it through was right. Flipping it
       * to 'full' on focus was not: `detent` decides the container's CSS `height` ('auto' vs
       * '100%'), so changing it mid-open resizes the sheet, and a resize mid-open used to restart
       * the entrance animation from the bottom of the screen.
       *
       * The sheet still grows to clear the keyboard — that now happens through `minHeight` below,
       * which is how selection-viewer has always done it.
       */
      detent={detent}
      ease="easeOut"
      duration={0.25}
      style={{ zIndex }}
      disableDrag={disableDrag}
      /*
       * The consumer's threshold, which was accepted and then dropped on the floor.
       *
       * `closeThreshold` has been in this component's props all along and was never passed on, so
       * every sheet used the underlying default of 0.6 whatever it asked for. Third prop found
       * accepted-and-ignored here, after `detent` and `minHeight`.
       */
      dragCloseThreshold={closeThreshold}
      avoidKeyboard={avoidKeyboard}
      // Never taller than the screen. Without a ceiling a long child list pushed the sheet's top
      // above the viewport, so its title and close button were off screen and unreachable.
      maxHeight={layoutProp?.maxHeight ?? '92dvh'}
    >
      <Sheet.Container
        id={id}
        ref={containerRef}
        backgroundColor={layoutProp?.backgroundColor || '#fff'}
        borderRadius="16px"
        boxShadow="0 -4px 20px rgba(0,0,0,0.15)"
        maxWidth={getMaxWidth()}
        className="bottom-viewer-container"
        // Announced as a modal dialog. Without this a screen reader treats it as another region of
        // the page and gives no indication that what is behind it is unavailable.
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{
          maxHeight: layoutProp?.maxHeight ?? '92dvh',
          /*
           * A floor, so the sheet does not animate open at zero height and then jump — and the
           * room a focused field needs to be scrolled clear of the keyboard.
           *
           * NOT TRANSITIONED. There was a `transition: min-height 0.2s ease` here, which meant the
           * container's height changed on every frame of that 200ms. Each of those frames was a
           * ResizeObserver callback, and the sheet's entrance used to restart on every one — so
           * the animation intended to smooth this out was the thing making it stutter.
           *
           * The sheet's own transform animation is the only motion here now. Same arrangement as
           * selection-viewer, which states `minHeight: isSearchFocused ? "100dvh" : minHeight`
           * with no transition at all.
           */
          minHeight: layoutProp?.minHeight ?? '20dvh',
        }}
      >
        <Sheet.Header>
          <div className="bottom-viewer-header">
            {cancelButton?.position === "left" && (
              <button
                className="bottom-viewer-cancel-btn left"
                style={cancelButton.style}
                onClick={handleCancelClick}
                aria-label={cancelButton.text || "Close"}
              >
                {cancelButton.view || cancelButton.text || "Cancel"}
              </button>
            )}

            {!disableDrag && (
              <div
                className="bottom-viewer-drag-handle"
                style={{
                  background: layoutProp?.handleColor || "#ccc",
                  width: layoutProp?.handleWidth || "40px"
                }}
              />
            )}

            {cancelButton?.position === "right" && (
              <button
                className="bottom-viewer-cancel-btn right"
                style={cancelButton.style}
                onClick={handleCancelClick}
                aria-label={cancelButton.text || "Close"}
              >
                {cancelButton.view || cancelButton.text || "Cancel"}
              </button>
            )}
          </div>
        </Sheet.Header>

        {/*
          NOT A DRAG SURFACE.

          `Sheet.Content` takes the same drag gesture the header does, so every text field inside a
          sheet sat on top of `drag: 'y'`. A touch that moves a few pixels while a thumb settles on
          an input is a drag, and on release the sheet asks whether it was dragged far enough to
          dismiss — measured as a fraction of the sheet's own height. A short content-sized sheet
          therefore closes on a smaller movement than a tall one, which is why this bit BottomViewer
          and not the full-screen search viewer: the same stray touch is 5% of a search sheet and
          40% of a 200px one.

          Dragging belongs to the handle and the header. Nothing is lost — the handle is still
          there, still drags, still dismisses.
        */}
        <Sheet.Content disableDrag>
          <div
            className="bottom-viewer-content"
            onClick={e => e.stopPropagation()}
            style={{
              // Pads by exactly what the keyboard is covering, so the last field in a form can
              // still be scrolled into view instead of sitting permanently underneath it.
              paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 16}px` : undefined,
            }}
          >
            {currentContent}
          </div>
        </Sheet.Content>
      </Sheet.Container>

      <Sheet.Backdrop
        {...({
          onTap: handleBackdropTap,
          onClick: handleBackdropTap,
        } as any)}
        style={{ cursor: backDrop ? 'pointer' : 'default' }}
      />
    </Sheet>
  );
});

BottomViewer.displayName = 'BottomViewer';

// ==================== Controller Hook ====================
interface Operation {
  open: () => void;
  close: () => void;
  toggle: () => void;
  updateContent: (content: React.ReactNode) => void;
  replaceContent: (content: React.ReactNode) => void;
  clearContent: () => void;
  isEventFromSheet: (event: React.MouseEvent | MouseEvent) => boolean;
}

const useBottomController = (): [
  string,
  Operation,
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
  React.RefObject<any>,
  React.ReactNode
] => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<React.ReactNode>(null);
  const sheetRef = useRef<any>(null);

  const [bottomViewId] = useState(() =>
    `bottomViewId-${Math.random().toString(36).substr(2, 9)}`
  );

  const operations: Operation = {
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen(prev => !prev), []),

    updateContent: useCallback((newContent: React.ReactNode) => {
      setCurrentContent(newContent);
      if (sheetRef.current?.updateContent) {
        sheetRef.current.updateContent(newContent);
      }
    }, []),

    replaceContent: useCallback((newContent: React.ReactNode) => {
      setCurrentContent(newContent);
      if (sheetRef.current?.replaceContent) {
        sheetRef.current.replaceContent(newContent);
      }
    }, []),

    clearContent: useCallback(() => {
      setCurrentContent(null);
      if (sheetRef.current?.clearContent) {
        sheetRef.current.clearContent();
      }
    }, []),

    isEventFromSheet: useCallback((event: React.MouseEvent | MouseEvent) => {
      if (sheetRef.current?.isEventFromSheet) {
        return sheetRef.current.isEventFromSheet(event);
      }
      return false;
    }, []),
  };

  return [bottomViewId, operations, isOpen, setIsOpen, sheetRef, currentContent];
};

// ==================== Stable wrapper — defined ONCE at module level ====================
// CRITICAL: Must live outside useBottomSheet. A component type defined inside a
// hook body gets a new function reference on every render, so React unmounts and
// remounts the entire subtree each time — causing the infinite flicker loop.
interface BottomViewerWrapperInternalProps extends Omit<BottomViewerProps, 'id' | 'isOpen' | 'onClose' | 'children'> {
  _stateRef: React.RefObject<{
    id: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    sheetRef: React.RefObject<any>;
  }>;
}

// Reads live state from a ref — stable identity, always fresh values.
const StableBottomViewerWrapper = React.memo(
  React.forwardRef<any, BottomViewerWrapperInternalProps>(({ _stateRef, ...props }, _ref) => {
    const s = _stateRef.current!;
    return (
      <BottomViewer
        ref={s.sheetRef}
        id={s.id}
        isOpen={s.isOpen}
        onClose={s.onClose}
        unmountOnClose={false}
        {...props}
      >
        {s.children}
      </BottomViewer>
    );
  })
);
StableBottomViewerWrapper.displayName = 'StableBottomViewerWrapper';

// ==================== Enhanced BottomSheet Hook ====================
const useBottomSheet = (initialContent?: React.ReactNode) => {
  const [id, operations, isOpen, , sheetRef, currentContent] = useBottomController();
  const [internalContent, setInternalContent] = useState<React.ReactNode>(initialContent || null);

  useEffect(() => {
    if (currentContent !== undefined) {
      setInternalContent(currentContent);
    }
  }, [currentContent]);

  // Ref that always holds the latest state — StableBottomViewerWrapper reads
  // from here so it sees current values without needing to be recreated.
  const stateRef = useRef({
    id,
    isOpen,
    onClose: operations.close,
    children: internalContent,
    sheetRef,
  });

  // Keep ref up-to-date on every render (synchronous, before any paint)
  stateRef.current = {
    id,
    isOpen,
    onClose: operations.close,
    children: internalContent,
    sheetRef,
  };

  const enhancedOps = {
    ...operations,
    open: (content?: React.ReactNode) => {
      if (content) {
        // Push content imperatively before isOpen flips so first frame is correct
        if (sheetRef.current?.updateContent) {
          sheetRef.current.updateContent(content);
        }
        setInternalContent(content);
        operations.updateContent(content);
      }
      operations.open();
    },
    updateContent: (content: React.ReactNode) => {
      setInternalContent(content);
      operations.updateContent(content);
    },
    replaceContent: (content: React.ReactNode) => {
      setInternalContent(content);
      operations.replaceContent(content);
    },
    clearContent: () => {
      setInternalContent(null);
      operations.clearContent();
    },
  };

  // Stable component reference — useCallback with [] gives permanent identity.
  // stateRef.current is always up-to-date so fresh values are read on every render.
  const BottomViewerWrapper: React.FC<Omit<BottomViewerProps, 'id' | 'isOpen' | 'onClose' | 'children'>> =
    useCallback(
      (props: Omit<BottomViewerProps, 'id' | 'isOpen' | 'onClose' | 'children'>) =>
        <StableBottomViewerWrapper _stateRef={stateRef} {...props} />,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    ) as any;

  return {
    isOpen,
    open: enhancedOps.open,
    close: enhancedOps.close,
    toggle: enhancedOps.toggle,
    updateContent: enhancedOps.updateContent,
    replaceContent: enhancedOps.replaceContent,
    clearContent: enhancedOps.clearContent,
    isEventFromSheet: operations.isEventFromSheet,
    BottomViewer: BottomViewerWrapper,
    currentContent: internalContent,
  };
};

export { BottomViewer, useBottomController, useBottomSheet };
export default BottomViewer;
