import '@testing-library/jest-dom/vitest';

// jsdom does not implement scrollTo on window or elements; provide no-ops so
// the scroll-restoration paths don't throw during tests.
if (typeof window !== 'undefined') {
  window.scrollTo = window.scrollTo || (() => {});
  // @ts-expect-error - augment the prototype for element scrolling
  Element.prototype.scrollTo = Element.prototype.scrollTo || function scrollTo() {};
}
