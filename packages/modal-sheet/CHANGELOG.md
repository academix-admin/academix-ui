# @academix-admin/modal-sheet

## 0.3.2

### Patch Changes

- 41a8f7b: Documentation: every export is named in its README (forms and pin-input had no README at all), and each
  package's README lists its parts' class names under "Styling the parts" — a public contract now, held by
  `test/parts.test.ts`, so an app can style any part without reaching into internals. No code changes.
- Updated dependencies [41a8f7b]
  - @academix-admin/overlay-route@0.1.2

## 0.3.1

### Patch Changes

- f4f2065: A sheet now always ends in the state `isOpen` asks for. Closed as its entrance finished, the entrance's
  last frame could set it open after the close and it stayed open, backdrop over the page, with `isOpen`
  false; reopened during its slide-out, it ended closed with `isOpen` true. The state machine now
  re-checks `isOpen` whenever its own state changes, and a finished entrance only counts if the sheet
  is still wanted open.
