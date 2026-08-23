---
"@academix-admin/navigation-bar": patch
---

Autohide: reveal the bar at the top of a page, and on a change of page.

Two ways an autohidden bar could become permanently unreachable:

- **At the top.** The handler returned early for `atTop` without touching `hidden`, so a jump
  straight to the top — `scrollTop = 0`, an anchor, a "back to top" control — left the bar hidden.
  The only thing that reveals it is an upward scroll, and at the top there is nothing left to
  scroll. Being at the top of a page is the clearest possible signal that the bar should show.

- **On navigation.** Scroll state belongs to the page that was scrolled, but it was carried across
  navigations, so arriving somewhere new could mean arriving with no visible navigation. If the new
  page's content then fits the screen, nothing will ever reveal it and the app is stranded.

Found in store-manager: scrolling down a stock list, opening a customer whose account fits on one
screen, and being left with no tab bar and no way to get it back.

The existing `!isScrollable` guard did not cover either case, because it only runs when an event
arrives — and a page that cannot scroll never sends one after mount.
