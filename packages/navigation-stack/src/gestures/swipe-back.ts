import type { NavStackAPI, SwipeBackOptions } from '../types';
// Edge swipe-back gesture hook.
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function useSwipeBack(
  containerRef: React.RefObject<HTMLElement | null>,
  nav: NavStackAPI,
  options: SwipeBackOptions = {}
) {
  const {
    edgeWidth = 24,
    threshold = 0.38,
    maxTranslate,
    cancelDuration = 300,
    commitDuration = 200,
    disabled = false,
  } = options;

  const gesture = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    topEl: HTMLElement | null;
    belowEl: HTMLElement | null;
    screenW: number;
    locked: boolean;
    committed: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    topEl: null,
    belowEl: null,
    screenW: 0,
    locked: false,
    committed: false,
  });

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const resolveMaxTranslate = (screenW: number) => {
      if (typeof maxTranslate === 'number') return maxTranslate;
      if (typeof maxTranslate === 'string' && maxTranslate.endsWith('%')) {
        const percent = Number.parseFloat(maxTranslate);
        return Number.isFinite(percent) ? screenW * (percent / 100) : screenW;
      }
      return screenW;
    };

    const getTopAndBelowPages = () => {
      const allPages = Array.from(
        container.querySelectorAll<HTMLElement>('[data-nav-uid]')
      );
      const visiblePages = allPages.filter((el) => !el.hasAttribute('inert'));
      return {
        top: visiblePages[visiblePages.length - 1] ?? null,
        below: visiblePages[visiblePages.length - 2] ?? null,
      };
    };

    const applyTranslate = (el: HTMLElement, px: number, duration = 0) => {
      el.style.transition = duration > 0
        ? `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        : 'none';
      el.style.transform = `translateX(${px}px)`;
      el.style.willChange = duration > 0 ? 'auto' : 'transform';
    };

    const resetTranslate = (el: HTMLElement, duration = 0) => {
      applyTranslate(el, 0, duration);
      if (duration > 0) {
        el.addEventListener('transitionend', () => {
          el.style.transition = '';
          el.style.transform = '';
          el.style.willChange = '';
          el.style.pointerEvents = '';
          el.style.boxShadow = '';
        }, { once: true });
      } else {
        el.style.transition = '';
        el.style.transform = '';
        el.style.willChange = '';
        el.style.pointerEvents = '';
        el.style.boxShadow = '';
      }
    };

    const applyBelowParallax = (el: HTMLElement, progress: number, duration = 0) => {
      const offsetPx = -0.3 * el.offsetWidth * (1 - progress);
      el.style.transition = duration > 0
        ? `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        : 'none';
      el.style.transform = `translateX(${offsetPx}px)`;
    };

    const resetBelow = (el: HTMLElement, duration = 0) => {
      applyBelowParallax(el, 0, duration);
      if (duration > 0) {
        el.addEventListener('transitionend', () => {
          el.style.transition = '';
          el.style.transform = '';
        }, { once: true });
      } else {
        el.style.transition = '';
        el.style.transform = '';
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (nav.length() <= 1) return;
      const touch = e.touches[0];
      if (touch.clientX > edgeWidth) return;

      const { top, below } = getTopAndBelowPages();
      if (!top) return;

      const g = gesture.current;
      g.active = true;
      g.startX = touch.clientX;
      g.startY = touch.clientY;
      g.currentX = touch.clientX;
      g.screenW = window.innerWidth;
      g.topEl = top;
      g.belowEl = below;
      g.locked = false;
      g.committed = false;

      top.style.pointerEvents = 'none';
      top.style.boxShadow = '-4px 0 16px rgba(0,0,0,0.15)';
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current;
      if (!g.active || g.locked || g.committed) return;

      const touch = e.touches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;

      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 12) {
        g.locked = true;
        if (g.topEl) resetTranslate(g.topEl);
        if (g.belowEl) resetBelow(g.belowEl);
        return;
      }

      if (dx < 0) return;

      e.preventDefault();

      g.currentX = touch.clientX;
      const translatePx = Math.min(dx, resolveMaxTranslate(g.screenW));

      if (g.topEl) applyTranslate(g.topEl, translatePx);
      if (g.belowEl) applyBelowParallax(g.belowEl, Math.min(translatePx / g.screenW, 1));
    };

    const onTouchEnd = () => {
      const g = gesture.current;
      if (!g.active) return;
      g.active = false;

      if (g.locked) {
        g.locked = false;
        return;
      }

      const dx = g.currentX - g.startX;
      const progress = dx / g.screenW;
      const commit = progress >= threshold;

      if (commit && !g.committed) {
        g.committed = true;

        if (g.topEl) applyTranslate(g.topEl, resolveMaxTranslate(g.screenW), commitDuration);
        if (g.belowEl) applyBelowParallax(g.belowEl, 1, commitDuration);

        window.setTimeout(() => {
          void nav.pop();
          if (g.topEl) resetTranslate(g.topEl);
          if (g.belowEl) resetBelow(g.belowEl);
        }, commitDuration);
      } else {
        if (g.topEl) resetTranslate(g.topEl, cancelDuration);
        if (g.belowEl) resetBelow(g.belowEl, cancelDuration);
      }

      g.topEl = null;
      g.belowEl = null;
    };

    const onTouchCancel = () => {
      const g = gesture.current;
      if (!g.active) return;
      g.active = false;
      g.locked = false;
      if (g.topEl) resetTranslate(g.topEl, cancelDuration);
      if (g.belowEl) resetBelow(g.belowEl, cancelDuration);
      g.topEl = null;
      g.belowEl = null;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [nav, edgeWidth, threshold, maxTranslate, cancelDuration, commitDuration, disabled, containerRef]);
}


