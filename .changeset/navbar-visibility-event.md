---
"@academix-admin/navigation-bar": patch
---

`onVisibilityChange`: tell the consumer what the bar is doing.

Consumers frequently anchor something else to the bar — a running total, a secondary action, a
toast — and there was no way to keep it in step. Two approaches were tried in the wild and both are
wrong:

- **Re-implementing the autohide rules in the consumer.** Two copies of a rule drift, and they did:
  at the bottom of a long scroll the consumer's control sat a bar's height away from the bar's own
  floating button, two things on one line visibly disagreeing about where that line was.
- **Listening for `transitionrun` on the bar's DOM node.** It works, but it reaches into another
  component's internals and breaks the moment the animation is expressed differently.

The bar knows its own state. It now says so, firing `{ hidden, height, mode }` on every change and
for every cause — a scroll, a change of page, or a tap on the floating button, which reveals the
bar with no scroll event at all. That last one is what made this necessary: anything watching
scrolling alone kept a stale position and ended up underneath the bar it was meant to sit above.

Purely additive; existing consumers are unaffected.
