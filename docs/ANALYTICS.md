# ANALYTICS.md

Analytics/tracking convention for Vulkano Framework projects.

## Default rule

Every project tracks analytics unless the user explicitly says tracking is not required for this project. If the task touches a form, button, download, video, page, or any other user interaction and no tracking exists yet, ask the user which provider(s) to wire up before considering the task done — don't skip tracking silently.

## Providers

The user supplies provider IDs (GA measurement ID, FB Pixel ID, Adobe report suite, GTM container ID, etc.) either as:

- an env var (e.g. `VITE_GA_ID`), or
- hardcoded directly in the server-rendered template / client JS.

Neither is "more correct" — pick whichever the user specifies for that project. There is no generic multi-provider wrapper library shipped with this framework; each provider's own official snippet/SDK is used directly, gated by whichever ID source the project chose.

## Libraries

- **Vue**: use [`vue-gtag`](https://github.com/MatteoGabriele/vue-gtag) for GA. Install with `pnpm add vue-gtag` and call this out explicitly in the diff (see [AGENTS.md § Safety boundaries](../AGENTS.md#safety-boundaries) — new dependencies are called out, not silently added).
- **Vanilla JS** (non-Vue pages, e.g. server-rendered templates with no Vue mount): use the standard `gtag.js` snippet as published by Google, injected in the page `<head>`.
- Other providers (FB Pixel, Adobe, GTM) follow their own official snippet/SDK — do not build a custom wrapper for them.

## Event naming convention

1. **Prefer GA4's recommended/reserved event names as-is** when the interaction matches one: `select_content`, `file_download`, `video_start` / `video_progress` / `video_complete`, `generate_lead`, `sign_up`, `login`, `share`, `search`, `view_item`, `add_to_cart`, `purchase`, etc. These get built-in reporting in GA4 — don't rename them.
2. **Custom event** (no GA4-recommended equivalent fits): `{section}_{action}`, where `action` is one of `click`, `download`, `error`, `success`, `swipe`, or a product/content name (`productName`). Examples: `hero_click`, `checkout_error`, `checkout_success`, `carousel_swipe`, `pricing_enterprise` (productName as action).
3. Form submissions specifically: track both outcomes — `{section}_success` and `{section}_error` — not just success.

## Custom dimensions warning

GA4 only retains **standard fields** (event name, and parameters on recommended events it already knows about) in reports by default. Any custom event parameter or custom event you send that isn't backed by a **custom dimension/metric configured in the GA4 Admin UI** is captured in raw event data but will NOT show up in standard reports or be usable in Explorations/Audiences.

**Whenever a task adds a custom event or a custom parameter that isn't a GA4-recommended one**, warn the user explicitly, e.g.:

> ⚠️ `checkout_error` sends a custom parameter `error_message`. This is not retained in GA4 reports unless you create a matching custom dimension in GA4 Admin → Custom definitions. Create it there, or the data won't be queryable.

Do not assume the user already created the custom dimension — always surface the warning when introducing a new custom event/parameter.
