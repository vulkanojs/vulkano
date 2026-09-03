---
name: vulkano-frontend-analytics
description: Use when adding or reviewing tracking on a frontend form, button, download, video, or page in this Vulkano framework project — vue-gtag/gtag.js wiring, GA4 event naming, GTM element ids, custom-dimension warnings, and the noindex/private-mode warning.
---

# Frontend Analytics

## Overview

Every project tracks analytics unless the user explicitly opted out for that area (check the SEO/Analytics/Accessibility table in the root CLAUDE.md first — a CMS/admin area is usually Analytics off). If a task touches a form, button, download, video, or page and no tracking exists yet, ask which provider(s) before considering the task done — don't skip silently.

## When to use

Any new/changed user interaction in `frontend/` — form submit, button click, file download, video play, page view. Not for backend event logging. Not for SEO — see docs/SEO.md.

## Provider wiring

- **Vue pages**: [`vue-gtag`](https://github.com/MatteoGabriele/vue-gtag) for GA. Not installed by default — `pnpm add vue-gtag` and call the install out explicitly in the diff.
- **Non-Vue/server-rendered pages**: standard `gtag.js` snippet in the page `<head>`, no wrapper library.
- Other providers (FB Pixel, Adobe, GTM) — use their own official snippet/SDK directly, no custom wrapper.
- **GTM**: every tracked element needs a unique `id` — GTM triggers match by `id`.
- Provider IDs come from an env var (`VITE_GA_ID`) or hardcoded, whichever the user specifies for that project — neither is more correct.

## Event naming

1. Prefer GA4's reserved/recommended names when the interaction matches: `select_content`, `file_download`, `video_start`/`video_progress`/`video_complete`, `generate_lead`, `sign_up`, `login`, `share`, `search`, `view_item`, `add_to_cart`, `purchase`. Don't rename these.
2. Otherwise, custom event: `{section}_{action}` — `action` is `click`/`download`/`error`/`success`/`swipe`, or a product/content name. E.g. `hero_click`, `checkout_error`, `pricing_enterprise`.
3. Forms specifically: track **both** outcomes, `{section}_success` and `{section}_error` — never just success.

```js
// inside a component's submit handler, after $api.post resolves/rejects
import { useGtag } from 'vue-gtag';
const { event } = useGtag();

try {
  await $api.post('/contact', form.value);
  event('contact_success');
} catch (_err) {
  event('contact_error');
}
```

## Custom dimensions warning

GA4 only retains standard fields by default. A custom event or custom parameter not backed by a GA4 Admin custom dimension is captured raw but invisible in reports/Explorations/Audiences. Whenever a task adds one, warn explicitly:

> Site sends custom parameter `error_message` on `checkout_error`. Not retained in GA4 reports unless a matching custom dimension is created in GA4 Admin → Custom definitions.

Don't assume the dimension already exists.

## Private-mode warning

New projects default to `SEO_NOINDEX=true` (private/noindex). Tracking still fires in this state — real traffic can get recorded before launch. Whenever adding/changing tracking, check `app.config.common.SEO_NOINDEX`; if still `true`, warn:

> Site is in private mode (`SEO_NOINDEX=true`). Tracking wired but site isn't indexable yet.

## After writing

- Confirm the area's Analytics column (root CLAUDE.md table) isn't "off" before adding anything.
- Surface the custom-dimension and private-mode warnings when they apply — don't skip silently.
- Run `vp check` and `vp test`.

## Reference

`docs/ANALYTICS.md` (full detail, incl. `docs/LAUNCH.md` pre-production checklist).
