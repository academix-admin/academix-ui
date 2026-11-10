---
'@academix-admin/navigation-stack': patch
---

One scroll, one broadcast. 1.10.1 let the scroll restore hear a Scaffold body, and its listener
broadcast every scroll a second time under the route key where the page shell uses the uid. A
NavigationBar in `autohide` shows itself whenever the source changes (a new page), so on every
Scaffold page the bar never hid. The restore listener now only records; the page shell remains the
one relay. Scroll restoration is unchanged.
