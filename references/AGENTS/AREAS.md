# Per-area requirements — SEO / Analytics / Accessibility

A single Vulkano project can have several entry points/areas at once (e.g. a public front — landing + form — plus a separate CMS/admin area, each its own Vue app/Vite entry/backend layout — see [references/AGENTS/ENTRYPOINTS.md](ENTRYPOINTS.md)) — decide **per area**, not once for the whole project. SEO in particular only ever applies to the public/crawlable area(s); a CMS/admin area is never a SEO target even when the front next to it has SEO on.

On the first task touching a new area (no row for it yet in `PROJECT.md`'s table), ask the user what that area is — landing page, landing + form, multi-page website, blog, embeddable widget, or CMS/admin panel — then set that row from the mapping instead of asking about SEO/Analytics/Accessibility one by one:

- **Landing / landing + form / website / blog** (public, crawlable pages) → SEO on, Analytics on, Accessibility on.
- **Embeddable widget** (mounts inside someone else's page, no page of its own to index) → SEO off, Accessibility on; Analytics — ask the user whether they want usage tracking (clicks, conversions) on the widget itself, don't assume off.
- **CMS / admin panel** (internal, logged-in tool) → SEO off, Analytics off, Accessibility on.
- Anything that doesn't fit cleanly: ask directly which of the three apply.

Show the user the resulting row so they can correct it before proceeding. From then on, treat `PROJECT.md`'s table as the answer and don't ask again for that area.

A blank/missing area means: not decided yet, ask on first touch. Marking an area's column "off" means: skip that doc entirely (don't read it, don't apply its checklist) for work scoped to that area — [references/AGENTS/SEO.md](SEO.md), [references/AGENTS/ANALYTICS.md](ANALYTICS.md), [references/AGENTS/ACCESSIBILITY.md](ACCESSIBILITY.md).
