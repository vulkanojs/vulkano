---
name: vulkano-seo
description: Use when adding or editing a public/crawlable backend view in this Vulkano framework project — res.locals.seo wiring (title/description/image), the noindex/private-mode default, robots.txt/sitemap.xml, and structured data (JSON-LD).
---

# SEO

## Overview

No Vue SSR/prerendering in this framework — the SPA (`client/`) is never a SEO target. Backend views (`app/views/*.html`, `res.render`) are the only crawlable surface, and only for areas marked SEO-on.

## When to use

Adding/editing a public backend view (landing, blog post, product/listing page). First confirm the area is SEO-on per the table in root `CLAUDE.md`/AGENTS.md § Project requirements — a CMS/admin area is never a SEO target even if it's server-rendered.

Not for the Vue SPA (never SEO-covered — build ranking pages as backend views instead). Not for `alt`/heading-order minimums — those are vulkano-frontend-a11y's, and already double as SEO signals here.

## Meta tags — `res.locals.seo`

1. **Global default** — `app/config/middlewares/seo.js` sets `res.locals.seo` on every request from `app/config/common.js` (`SEO_DEFAULT_TITLE`, `SEO_DEFAULT_DESCRIPTION`, `SEO_DEFAULT_IMAGE`):

```js
// app/config/middlewares/seo.js
module.exports = (req, res, next) => {
  if (req.path.startsWith('/cms')) return next(); // skip early for a non-SEO area's prefix
  res.locals.seo = {
    title: app.config.common.SEO_DEFAULT_TITLE,
    description: app.config.common.SEO_DEFAULT_DESCRIPTION,
    image: app.config.common.SEO_DEFAULT_IMAGE,
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
  };
  next();
};
```

A CMS/admin base template shouldn't reference `seo.*` at all (hardcoded plain `<title>` instead) — the early return above is defense-in-depth, not something it relies on.

2. **Per-route override** — merge into `res.locals.seo` in the controller before `res.render`:

```js
'get :slug'(req, res) {
  Post.findOne({ slug: req.params.slug }).then((post) => {
    res.locals.seo = { ...res.locals.seo, title: post.title, description: post.excerpt, image: post.coverImage };
    res.render('blog/show', { post });
  });
}
```

See vulkano-backend-controller for controller conventions.

3. **Template** prints `seo.*` (Nunjucks/Handlebars read `res.locals` automatically — see vulkano-backend-views):

```html
<title>{{ seo.title }}</title>
<meta name="description" content="{{ seo.description }}" />
<link rel="canonical" href="{{ seo.url }}" />
<meta property="og:title" content="{{ seo.title }}" />
<meta property="og:image" content="{{ seo.image }}" />
<meta name="twitter:card" content="summary_large_image" />
```

## Private mode / noindex default

New projects start **not indexable** by default:

- `app/config/common.js` — `SEO_NOINDEX: process.env.SEO_NOINDEX !== 'false'` (default `true`).
- `seo.js` middleware copies it to `res.locals.seo.noindex`; the default template prints `<meta name="robots" content="noindex, nofollow" />` when true.
- `public/robots.txt` ships `Disallow: /` by default.

Whenever a task adds analytics/tracking while the project is still in this default private state, surface the vulkano-frontend-analytics private-mode warning — easy to forget flipping both together at launch. Full pre-production checklist: `docs/LAUNCH.md`.

## Sitemap and robots

- `public/robots.txt` — allow public backend views, disallow the SPA app-shell prefix (nothing to index there). Starts `Disallow: /` per private mode above.
- `public/sitemap.xml` — static file for a fixed page set; generate from a controller/service when data-driven (blog posts, products).

## Structured data

Add JSON-LD (`Article`, `Product`, `Organization`, ...) in the view template, sourced from the same locals as the meta tags — don't duplicate content into a separate data source.

## After writing

For every new/changed crawlable view, required unless the user opted out for that page:

- [ ] Unique `title` (route override or default).
- [ ] Unique `description`.
- [ ] `image` set for `og:image`/`twitter:image`.

Don't skip silently — ask the user whether the shared default is acceptable or a page-specific one is needed. Run `vp check` and `vp test`.

## Reference

`docs/SEO.md` (full detail incl. multi-area setups), `docs/LAUNCH.md`, vulkano-backend-controller, vulkano-backend-views, vulkano-frontend-a11y, vulkano-frontend-analytics.
