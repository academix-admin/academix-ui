---
"@academix-admin/scroll-date-picker": minor
"@academix-admin/modal-sheet": minor
"@academix-admin/search-viewer": minor
---

Initial release of three UI components extracted from academix-web:

- `@academix-admin/scroll-date-picker`: iOS-style wheel/scroll date picker with
  magnifier, quick-date shortcuts and full theming. Zero deps beyond React.
- `@academix-admin/modal-sheet`: gesture-driven bottom sheet built on Motion, with
  snap detents, keyboard avoidance and a compound `Sheet.*` API. `motion` is a
  peer dependency.
- `@academix-admin/search-viewer`: debounced search + selection UI with local and
  async cursor-paginated data sources, built-in loading/empty/error states, and
  a `useSearchController` hook. Depends on `@academix-admin/modal-sheet`.
