import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  window.scrollTo = window.scrollTo || (() => {});
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error minimal stub
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  if (!window.matchMedia) {
    // @ts-expect-error minimal stub
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  }
}
