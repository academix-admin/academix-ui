// Internal constants and the isomorphic layout-effect helper.
import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useEffect : () => { };

export const GROUP_STYLE_CSS = `
  .group-navigation-stack {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .group-stack-container {
    width: 100%;
    height: 100%;
  }

  .group-stack-hidden {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    opacity: 0 !important;
  }

  .group-stack-active {
    display: block !important;
    visibility: visible !important;
    pointer-events: all !important;
    opacity: 1 !important;
  }

  .group-stack-container {
    transition: opacity 0.2s ease;
  }
`;

export const DEFAULT_TRANSITION_DURATION = 220;
export const DEFAULT_MAX_STACK_SIZE = 50;
export const STORAGE_TTL_MS = 1000 * 60 * 30;
export const MEMORY_CACHE_SIZE = 5;
export const MEMORY_CACHE_EXPIRY = 1000 * 60 * 5;
export const NAV_STACK_VERSION = '1';
export const STACK_SEPARATOR = 'x';
