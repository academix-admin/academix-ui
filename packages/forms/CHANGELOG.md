# @academix-admin/forms

## 0.2.0

### Minor Changes

- Two new fields, additive: `ChoiceChips` (pick one value from a row of chips; a radio group with
  arrow-key movement and one tab stop) and `NumberStepper` (− / value / + with min, max and step, an
  announcing `<output>`, and named buttons). Both are headless like the rest of the family: style every
  part through `classNames`. First consumer: JimsAjo's calculator. Nothing existing changes.

## 0.1.1

### Patch Changes

- 41a8f7b: Documentation: every export is named in its README (forms and pin-input had no README at all), and each
  package's README lists its parts' class names under "Styling the parts" — a public contract now, held by
  `test/parts.test.ts`, so an app can style any part without reaching into internals. No code changes.
