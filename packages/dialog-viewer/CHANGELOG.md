# @academix-admin/dialog-viewer

## 0.6.0

### Minor Changes

- 289a713: Theming through `layoutProp`: `fontFamily`, a coloured title band (`headerBackground`, `headerAlign`, `titleFontSize`, `titleFontWeight`) and the buttons' shape (`buttonRadius`, `buttonFontSize`, `buttonFontWeight`, `buttonShadow`). All optional; the defaults are what the dialog always drew. Fixes: `borderRadius` now holds on phones (it was always 16px under 480px), and `dangerTextColor` is no longer overridden by a hard-coded white. README usage rewritten to the real API.
