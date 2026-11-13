---
'@academix-admin/navigation-stack': patch
---

`GroupNavigationStack` hydrates on the tab the server drew (`current`) and moves to the URL's `?group=`
tab right after. Opening a server-rendered app on another tab's URL used to draw two tabs at once: the
client's first render picked the URL's tab, and React left the server's "active" on the first one.
