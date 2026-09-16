# PROJECT.md

Project-specific source of truth. Never touched by a template update (pulling a newer `AGENTS.md` from the Vulkano template) — the only place project name, purpose, and per-area decisions belong. `AGENTS.md` includes this file via `@PROJECT.md`.

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It is the starting point for new Vulkano-based applications.

<!-- On project init: replace the paragraph above with this project's actual name and one-line purpose. -->

## Project requirements — SEO / Analytics / Accessibility

A single Vulkano project can have several entry points/areas at once (e.g. a public front — landing + form — plus a separate CMS/admin area, each its own Vue app/Vite entry/backend layout — see [reference/ARCHITECTURE.md § Multiple entry points](reference/ARCHITECTURE.md#multiple-entry-points--front--cms-or-any-other-split-app)) — decide **per area**, not once for the whole project. SEO in particular only ever applies to the public/crawlable area(s); a CMS/admin area is never a SEO target even when the front next to it has SEO on.

On the first task touching a new area (no row for it yet in the table below), ask the user what that area is — landing page, landing + form, multi-page website, blog, embeddable widget, or CMS/admin panel — then set that row from the mapping instead of asking about SEO/Analytics/Accessibility one by one:

- **Landing / landing + form / website / blog** (public, crawlable pages) → SEO on, Analytics on, Accessibility on.
- **Embeddable widget** (mounts inside someone else's page, no page of its own to index) → SEO off, Accessibility on; Analytics — ask the user whether they want usage tracking (clicks, conversions) on the widget itself, don't assume off.
- **CMS / admin panel** (internal, logged-in tool) → SEO off, Analytics off, Accessibility on.
- Anything that doesn't fit cleanly: ask directly which of the three apply.

Show the user the resulting row so they can correct it before proceeding. From then on, treat this table as the answer and don't ask again for that area:

| Area (path/entry point)                    | SEO | Analytics | Accessibility |
| ------------------------------------------ | --- | --------- | ------------- |
| `/` (`frontend/website/`) — public site    | on  | on        | on            |
| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |

A blank/missing area means: not decided yet, ask on first touch. Marking an area's column "off" means: skip that doc entirely (don't read it, don't apply its checklist) for work scoped to that area — [reference/SEO.md](reference/SEO.md), [reference/ANALYTICS.md](reference/ANALYTICS.md), [reference/ACCESSIBILITY.md](reference/ACCESSIBILITY.md).
