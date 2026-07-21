---
"@academix/scroll-date-picker": minor
"@academix/modal-sheet": minor
"@academix/search-viewer": minor
---

Initial release of three UI components extracted from academix-web:

- `@academix/scroll-date-picker`: iOS-style wheel/scroll date picker with
  magnifier, quick-date shortcuts and full theming. Zero deps beyond React.
- `@academix/modal-sheet`: gesture-driven bottom sheet built on Motion, with
  snap detents, keyboard avoidance and a compound `Sheet.*` API. `motion` is a
  peer dependency.
- `@academix/search-viewer`: debounced search + selection UI with local and
  async cursor-paginated data sources, built-in loading/empty/error states, and
  a `useSearchController` hook. Depends on `@academix/modal-sheet`.
