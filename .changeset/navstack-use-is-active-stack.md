---
'@academix-admin/navigation-stack': minor
---

Add `useIsActiveStack()` — is this stack the one on screen?

In a group of tabs only one stack is shown; the others stay mounted and hidden. A page that acts on
its own — offering a screen, starting a scan, asking a question — needs to know which, and
`api.isActiveStack()` is not that question: it reports whether the stack syncs history, which is
true of every tab at once. Reported from store-manager, where the till read it that way and pushed
its count screen onto the Money tab during start-up; the history entry that push created then
swallowed the next Back press. Outside a group there is one stack, so the answer is yes.
