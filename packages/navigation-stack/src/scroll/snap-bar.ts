'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Where a travelling app bar should come to rest when scrolling stops (`Scaffold` `snap`).
 *
 * A bar that travels with the page can be left half on screen when someone stops scrolling inside
 * its height, and a half bar reads as a layout fault. Snapping settles it: less than half of the bar
 * gone, it comes back (top of the page); half or more gone, it goes, and whatever is sticky beneath
 * it (a pinned toolbar or section) takes the top. Outside the bar's height it does nothing.
 *
 * Returns the scrollTop to settle at, or `null` to leave the page where it is.
 */
export function snapTarget(scrollTop: number, barHeight: number, maxScroll: number): number | null {
  // How far the bar can go: all of it, or as far as a short page can scroll.
  const hidden = Math.min(barHeight, Math.max(0, maxScroll));
  if (hidden <= 0 || scrollTop <= 0 || scrollTop >= hidden) return null;
  // Settle at whichever end is nearer.
  const target = scrollTop < hidden / 2 ? 0 : hidden;
  return Math.abs(target - scrollTop) < 1 ? null : target;
}

/** How long the page must be still before it settles, where `scrollend` isn't available. */
export const SNAP_IDLE_MS = 140;

/**
 * Settles a travelling bar (`barRef`, the first child of its scroll body) once scrolling stops:
 * on `scrollend` where the browser has it, else after `SNAP_IDLE_MS` without a scroll event. Never
 * while a finger is on the screen, so it can't fight a drag. Smooth unless the user prefers reduced
 * motion.
 */
export function useSnapTravellingBar(barRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const bar = barRef.current;
    const body = bar?.parentElement;
    if (!enabled || !bar || !body) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let touching = false;
    const settle = () => {
      if (touching) return;
      const target = snapTarget(body.scrollTop, bar.offsetHeight, body.scrollHeight - body.clientHeight);
      if (target === null) return;
      const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      body.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    };
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, SNAP_IDLE_MS);
    };
    const onScrollEnd = () => {
      clearTimeout(timer);
      settle();
    };
    const onTouchStart = () => {
      touching = true;
      clearTimeout(timer);
    };
    const onTouchEnd = () => {
      touching = false;
      later();
    };
    const hasScrollEnd = 'onscrollend' in window;
    body.addEventListener('scroll', later, { passive: true });
    if (hasScrollEnd) body.addEventListener('scrollend', onScrollEnd);
    body.addEventListener('touchstart', onTouchStart, { passive: true });
    body.addEventListener('touchend', onTouchEnd, { passive: true });
    body.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      clearTimeout(timer);
      body.removeEventListener('scroll', later);
      if (hasScrollEnd) body.removeEventListener('scrollend', onScrollEnd);
      body.removeEventListener('touchstart', onTouchStart);
      body.removeEventListener('touchend', onTouchEnd);
      body.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [barRef, enabled]);
}
