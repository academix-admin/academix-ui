import '@testing-library/jest-dom/vitest';

// jsdom is missing a few APIs the sheet / Motion touch on during render.
if (typeof window !== 'undefined') {
  window.scrollTo = window.scrollTo || (() => {});
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error minimal stub
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.matchMedia) {
    // @ts-expect-error minimal stub
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
  }
  if (!window.visualViewport) {
    // @ts-expect-error minimal stub — SelectionViewer tracks keyboard height off this
    window.visualViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      addEventListener() {},
      removeEventListener() {},
    };
  }
}
