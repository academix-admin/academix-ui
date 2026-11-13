---
'@academix-admin/forms': patch
'@academix-admin/pin-input': patch
'@academix-admin/sidebar': patch
'@academix-admin/selection-viewer': patch
'@academix-admin/overlay-route': patch
'@academix-admin/bottom-viewer': patch
'@academix-admin/dialog-viewer': patch
'@academix-admin/navigation-bar': patch
'@academix-admin/side-drawer': patch
'@academix-admin/scroll-date-picker': patch
'@academix-admin/search-viewer': patch
'@academix-admin/modal-sheet': patch
---

Documentation: every export is named in its README (forms and pin-input had no README at all), and each
package's README lists its parts' class names under "Styling the parts" — a public contract now, held by
`test/parts.test.ts`, so an app can style any part without reaching into internals. No code changes.
