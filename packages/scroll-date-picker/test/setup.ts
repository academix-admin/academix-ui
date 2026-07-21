import '@testing-library/jest-dom/vitest';

// jsdom lacks scrollTo; the wheel columns call it during layout.
if (typeof window !== 'undefined') {
  window.scrollTo = window.scrollTo || (() => {});
  // @ts-expect-error augment prototype for element scrolling
  Element.prototype.scrollTo = Element.prototype.scrollTo || function () {};
  // @ts-expect-error augment prototype for scrollIntoView
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};
}
