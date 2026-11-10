---
'@academix-admin/navigation-stack': patch
---

Scroll restore keeps a position only when a person moved the page (a wheel, touch, pointer or key inside it shortly before, or the momentum after a flick). Safari fires a scroll to 0 when a tab is shown again, before that tab's restore runs; since 1.10.1 it was saved over the real position, so every tab switch on iPhone came back at the top.
