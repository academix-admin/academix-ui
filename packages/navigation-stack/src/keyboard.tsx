'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Keyboard / viewport-inset primitives (Workstream F, extracted from academix-web
 * after being device-proven on iOS Safari).
 *
 * The mobile virtual keyboard shrinks the *visual* viewport but leaves the *layout*
 * viewport unchanged, so anything anchored to the layout viewport (fixed headers,
 * bottom bars, centered dialogs) ignores the keyboard. These primitives publish the
 * visible-viewport box as CSS variables on `<html>` (the "variables are the
 * contract" pattern) so an app shell can size itself to the visible area and stay
 * keyboard-safe:
 *
 *   --ax-keyboard-inset       occluded bottom height (px) — Flutter viewInsets.bottom
 *   --ax-viewport-offset-top  visualViewport.offsetTop (px)
 *   --ax-vv-height            visualViewport.height (px)  — the visible viewport height
 *   [data-ax-keyboard="open"] on <html> while a keyboard is open (nav-hide signal)
 *
 * Consumers only READ the vars (0px fallbacks), so this is non-breaking. A typical
 * app shell is `position: fixed; top: var(--ax-viewport-offset-top,0px);
 * height: var(--ax-vv-height, 100dvh)` so it tracks the visible viewport, and the
 * page body is a `ColumnBody` (keyboard-agnostic). Enable the document scroll-lock
 * with `useResizeToAvoidKeyboard` (Flutter's Scaffold.resizeToAvoidBottomInset).
 *
 * NOTE on iOS: Safari will still scroll the whole document on the FIRST focus of a
 * field the keyboard would hide — a platform limitation pure web can't reliably
 * override. The common case (field already reasonably positioned) is fully handled.
 */

export interface ViewportInsetsOptions {
  /**
   * Keep the focused field above the keyboard, the way a native screen does.
   *
   * A shell sized to the visible viewport shrinks when the keyboard rises, and whatever was in
   * its lower part is then below the fold of the page's own scroll region — including, sometimes,
   * the very field that was tapped. Android's `adjustResize` and Flutter's `Scaffold` answer the
   * same moment by scrolling the field's own scroller just enough to show it, and so does this:
   * on focus, and again each time the visible viewport gets shorter (the keyboard arriving, or
   * growing a suggestion row), the nearest scrolling ancestor of the focused field is moved by the
   * least amount that puts the field `margin` px clear of the keyboard. Nothing moves when it is
   * already in view, and nothing moves while the person scrolls with the keyboard up.
   *
   * Opt-in, because it scrolls the page: `true` for the default 16px margin, or `{ margin }`.
   */
  revealFocusedField?: boolean | { margin?: number };
}

/** The nearest ancestor that scrolls vertically, or null when nothing does. */
function scrollParentOf(node: Element): HTMLElement | null {
  let el: HTMLElement | null = node.parentElement;
  while (el && el !== document.body && el !== document.documentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Publishes the visible-viewport CSS variables from the VisualViewport API. Mount
 * once near the app root (e.g. via `ViewportInsetsProvider`). Sanity-clamped,
 * immediate on viewport change, and resume-safe (Safari can restore a stale
 * viewport after backgrounding).
 */
export function useViewportInsets(options: ViewportInsetsOptions = {}): void {
  // Read through a ref, so the listeners below are set up once however the option is passed.
  const revealRef = useRef(options.revealFocusedField);
  revealRef.current = options.revealFocusedField;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    if (!vv) return; // no VisualViewport: leave 0px fallbacks

    let frame = 0;
    // Proactive "keyboard open" signal driven by input focus, NOT only by the measured
    // inset. On iOS the FIRST focus reads inset ~0 (Safari scrolls the document instead of
    // shrinking, so vvOffsetTop cancels the height loss), which left the bottom nav showing
    // until the keyboard was dropped + reopened. Focus fires immediately, so we OR it in.
    //
    // The focus state is derived LIVE from document.activeElement (not a cached boolean):
    // an overlay (SearchViewer/dialog) whose focused input is REMOVED from the DOM on close
    // does not fire `focusout`/`blur` in Chromium — a cached `focused=true` would then stay
    // stuck and leave the nav hidden forever. A MutationObserver catches that silent removal
    // so the signal self-clears even when no viewport resize fires.
    const isField = (el: any): boolean =>
      !!el &&
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) &&
      !(el as HTMLInputElement).readOnly &&
      (el as HTMLInputElement).type !== 'hidden' &&
      (el as HTMLElement).getAttribute?.('contenteditable') !== 'true';

    const activeField = (): Element | null => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !isField(el)) return null;
      const r = el.getBoundingClientRect();
      // A focused field with no box, or one pushed OUT of the visible viewport — e.g. an
      // overlay (SearchViewer/sheet) SWIPED off-screen while its input keeps focus — must not
      // hold the keyboard signal open. (A keyboard-open field is scrolled INTO view, so it
      // still passes.) This complements the MutationObserver, which only catches DOM removal.
      if (r.width === 0 && r.height === 0) return null;
      const onScreen = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      return onScreen ? el : null;
    };

    /*
     * THE FOCUSED FIELD, BROUGHT CLEAR OF THE KEYBOARD (`revealFocusedField`).
     *
     * Measured against the VISIBLE viewport, not the scroller alone: during the keyboard's
     * arrival the shell has not always caught up, and the field the person is about to type in is
     * the one thing that must not sit under it. Only ever scrolls DOWN the page (field moved up):
     * a field above the visible area was put there by the person scrolling, and a pinned header
     * may be covering that edge anyway.
     */
    const reveal = () => {
      const option = revealRef.current;
      if (!option) return;
      const margin = typeof option === 'object' && option.margin != null ? option.margin : 16;
      const el = document.activeElement as HTMLElement | null;
      if (!el || !isField(el) || !el.isConnected) return;
      const scroller = scrollParentOf(el);
      if (!scroller) return;
      const field = el.getBoundingClientRect();
      if (field.width === 0 && field.height === 0) return;
      const box = scroller.getBoundingClientRect();
      const top = Math.max(box.top, vv.offsetTop);
      const bottom = Math.min(box.bottom, vv.offsetTop + vv.height) - margin;
      if (field.bottom <= bottom) return;
      // A field taller than the room left shows its top, which is where the caret starts.
      const by = Math.min(field.bottom - bottom, Math.max(0, field.top - top - margin));
      if (by > 0) scroller.scrollTop += by;
    };
    let revealTimer = 0;
    const revealSoon = () => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(reveal));
      window.clearTimeout(revealTimer);
      // And once the keyboard has finished arriving, for a platform that reports it late.
      revealTimer = window.setTimeout(reveal, 350);
    };
    let lastHeight = vv.height;

    const setKb = (open: boolean) => {
      if (open) root.setAttribute('data-ax-keyboard', 'open');
      else root.removeAttribute('data-ax-keyboard');
    };

    // Watch for the focused field being detached from the DOM (silent, no focusout).
    let watched: Element | null = null;
    let mo: MutationObserver | null = null;
    const stopWatch = () => { if (mo) { mo.disconnect(); mo = null; } watched = null; };
    const startWatch = (el: Element) => {
      watched = el;
      if (mo || typeof MutationObserver === 'undefined') return;
      mo = new MutationObserver(() => {
        if (watched && !watched.isConnected) { stopWatch(); apply(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    };

    /*
     * A KEYBOARD THAT WAS SEEN, AND THEN WENT (1.11.2).
     *
     * Focus alone holds the flag open — it has to, because iOS reports no inset on the first focus.
     * But a keyboard can go without the field losing focus: swiped down, Android's Back, the iPad's
     * hide key. The field kept focus, so the flag stayed open and the tab bar and floating buttons
     * stayed hidden over a page with no keyboard on it (10 Nov). So once a keyboard has been MEASURED
     * during a focus, its going closes the flag, focus or not; the next focus starts afresh.
     *
     * Measured two ways: the inset, and how much shorter the visible viewport is than the tallest it
     * has been at this width — for a browser that shrinks the layout viewport with it, where the
     * inset reads 0 throughout.
     */
    let sawKeyboard = false;
    let tallest = vv.height;
    let tallestAtWidth = vv.width;

    const apply = () => {
      frame = 0;
      const vh = vv.height;
      const raw = window.innerHeight - vh - vv.offsetTop;
      // A soft keyboard can never be taller than the visible viewport; anything
      // >= vvHeight (or negative) is a transient/bogus value (iOS resizes AND
      // scrolls) — treat as "no keyboard" rather than writing garbage.
      const inset = raw > 0 && raw < vh ? Math.round(raw) : 0;
      root.style.setProperty('--ax-keyboard-inset', `${inset}px`);
      root.style.setProperty('--ax-viewport-offset-top', `${Math.round(vv.offsetTop)}px`);
      root.style.setProperty('--ax-vv-height', `${Math.round(vh)}px`);
      if (Math.abs(vv.width - tallestAtWidth) > 1) {
        // Turned or resized: what counts as full height starts again.
        tallestAtWidth = vv.width;
        tallest = vh;
      }
      tallest = Math.max(tallest, vh);
      const measured = inset > 60 || tallest - vh > 150;
      if (measured) sawKeyboard = true;
      setKb(measured || (!!activeField() && !sawKeyboard));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };
    const onVV = () => apply();
    // Shorter means the keyboard came up or grew: the moment a field can end up under it.
    const onVVResize = () => {
      apply();
      if (vv.height < lastHeight - 1) revealSoon();
      lastHeight = vv.height;
    };
    const onResume = () => apply();

    const onFocusIn = (e: Event) => {
      if (isField(e.target)) {
        sawKeyboard = false;
        startWatch(e.target as Element);
        apply();
        revealSoon();
      }
    };
    const onFocusOut = () => {
      // Defer: focus may be moving to another field; re-derive the authoritative state.
      window.setTimeout(() => {
        const el = activeField();
        if (el) startWatch(el);
        else { stopWatch(); sawKeyboard = false; apply(); }
      }, 60);
    };

    apply();
    const t1 = window.setTimeout(apply, 300);
    const t2 = window.setTimeout(apply, 900);
    vv.addEventListener('resize', onVVResize);
    vv.addEventListener('scroll', onVV);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('pageshow', onResume);
    document.addEventListener('visibilitychange', onResume);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    // Swipe-to-dismiss (react-modal-sheet etc.) may not blur/remove the input synchronously;
    // re-derive on touch release so a sheet swiped off-screen restores the nav.
    document.addEventListener('touchend', schedule, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(revealTimer);
      vv.removeEventListener('resize', onVVResize);
      vv.removeEventListener('scroll', onVV);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onResume);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      document.removeEventListener('touchend', schedule);
      stopWatch();
      root.style.removeProperty('--ax-keyboard-inset');
      root.style.removeProperty('--ax-viewport-offset-top');
      root.style.removeProperty('--ax-vv-height');
      root.removeAttribute('data-ax-keyboard');
    };
  }, []);
}

/** Mounts `useViewportInsets` and renders its children. Put near the app root. */
export function ViewportInsetsProvider({
  children,
  revealFocusedField,
}: { children?: React.ReactNode } & ViewportInsetsOptions) {
  useViewportInsets({ revealFocusedField });
  return <>{children}</>;
}

export interface ResizeToAvoidKeyboardOptions {
  /**
   * Lock document scroll while the app shell is mounted (Flutter's
   * `Scaffold.resizeToAvoidBottomInset`). iOS can't then scroll the whole page to
   * reveal a focused field — which would drag a pinned header out of view — so the
   * page's own scroll region handles it. A document-wide effect, hence a toggle.
   * Default: true.
   */
  enabled?: boolean;
}

/**
 * Locks `<body>`/`<html>` scroll while mounted (reversible, and re-asserts on
 * `pageshow`/`visibilitychange` because Safari can drop inline styles when restoring
 * a backgrounded tab). Pair with `useViewportInsets` + a viewport-tracking shell.
 */
export function useResizeToAvoidKeyboard({ enabled = true }: ResizeToAvoidKeyboardOptions = {}): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bPos: body.style.position, bTop: body.style.top, bLeft: body.style.left,
      bW: body.style.width, bH: body.style.height, bOf: body.style.overflow,
      hOf: html.style.overflow,
    };
    const lock = () => {
      body.style.position = 'fixed';
      body.style.top = '0';
      body.style.left = '0';
      body.style.width = '100%';
      body.style.height = '100%';
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    };
    lock();
    const onResume = () => lock();
    window.addEventListener('pageshow', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => {
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onResume);
      body.style.position = prev.bPos;
      body.style.top = prev.bTop;
      body.style.left = prev.bLeft;
      body.style.width = prev.bW;
      body.style.height = prev.bH;
      body.style.overflow = prev.bOf;
      html.style.overflow = prev.hOf;
    };
  }, [enabled]);
}
