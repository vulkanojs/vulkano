---
name: vulkano-backend-views-handlebars
description: Use when creating or editing a server-rendered backend view, layout, partial, or error template in this Vulkano framework project, only if app/config/views.js sets engine 'handlebars' — layout wrapping (defaultLayout/{{{body}}}), res.render, SEO locals, i18n, custom formatting helpers (dates, numbers, currency), and Vite asset injection.
---

# Backend Views (Handlebars)

## Overview

Backend views (`app/views/*.html`) are server-rendered templates — the crawlable surface for public pages (see SEO.md). A controller renders one via `res.render('folder/file.html', { ...locals })`. Separate from the Vue SPA (`client/`), which is client-rendered and not SEO-covered.

**This skill applies only when `app/config/views.js` sets `engine: 'handlebars'`.** No file present, or `engine: 'nunjucks'`, means Nunjucks (the core default) — use the vulkano-backend-views-nunjucks skill instead. For the `res.render` vs `res.vsr` decision itself (HTML view vs JSON API), see vulkano-backend-views.

## When to use

- New page needs a server-rendered view/template
- Editing a layout, partial, or error page (404/500)
- Wiring SEO meta tags into a template
- Passing a translated string into a view
- Formatting a date, number, or currency value for display

Not for Vue components/views (`client/views/`) — see FRONTEND.md. Not for the controller that renders it — see vulkano-backend-controller skill.

## Before implementing

- Confirm `app/config/views.js` really sets `engine: 'handlebars'` — don't apply this skill on an assumption.
- Check `app/views/_shared/templates/default.html` (the `defaultLayout`) before writing a new page — it already owns `<head>`.
- Check whether this view belongs to a public/crawlable area (needs the SEO block) or a CMS/admin area (doesn't) — see AGENTS.md § Project requirements, and ARCHITECTURE.md § Multiple entry points if the project splits front/CMS.
- Trace the controller action that renders this view — confirm what locals it actually passes (`res.render('x/y.html', { ...locals })`). Don't assume a variable exists in the template; if data is missing, add it in the controller/model, not with a query/fetch from inside the template.
- Markup repeated across 2+ views → extract to `app/views/_shared/partials/`, included via `{{> name}}`, instead of duplicating. This applies even when you're adding those 2+ views one at a time in the same task — check back against files you already wrote earlier in the SAME task, not just pre-existing ones. E.g. a branded side-panel/header block copy-pasted into `login.html`, then again into `error.html`, then again into a third view → stop, move it to `_shared/partials/oauth-brand.html` and include it in all three:
  ```html
  {{> oauth-brand}}
  ```

## File placement

```
app/views/
  _shared/
    templates/     # base layouts, e.g. default.html (defaultLayout)
    partials/       # reusable includes, {{> name}}
    errors/         # 404.html, 500.html
  <resource>/
    index.html      # rendered via res.render('<resource>/index.html', {...})
```

### Naming convention — mirror the URL/controller shape

Not automatic (every `res.render(...)` call is explicit), but keep the view path consistent with the route it serves, mirroring the routing convention from vulkano-backend-controller:

- `/controller/action` (`ControllerController.action`) → `app/views/controller/action.html`
- `/module/controller/action` (nested under a module folder) → `app/views/module/controller/action.html`

E.g. `HomeController.get()` → `app/views/home/index.html`. A controller at `app/controllers/blog/PostsController.js` rendering `show` → `app/views/blog/posts/show.html`.

## Layout wrapping (`express-handlebars`)

Wrapping is implicit, not declared in the page — no `{% extends %}` equivalent. The page file is just the content fragment (no `<html>`/`<head>`); the layout at `_shared/templates/default.html` (the `defaultLayout`) wraps every render and injects the page via `{{{body}}}`:

```html
<!-- app/views/_shared/templates/default.html -->
<!doctype html>
<html>
  <head
    >...</head
  >
  <body
    >{{{body}}}</body
  >
</html>
```

```html
<!-- app/views/home/index.html -->
<h1>{{title}}</h1>
```

Triple-stash `{{{body}}}` (not `{{body}}`) — the rendered page HTML must not be escaped.

## Rendering from a controller

```js
res.render('home/index.html', { title: 'Home' });
```

Locals passed here, plus anything already on `res.locals` (e.g. set by a global middleware), are available in the template — Express merges `res.locals` in automatically for any view engine, no extra wiring.

## Rendering a paginated list / report

`Model.getAll(props)` (see vulkano-backend-model) resolves to a page object: `{ items, page, perPage, totalPages, next, prev, cursor }` — pass it straight through as a local and iterate `.items`, then use the rest for pagination controls:

```js
// controller
res.render('orders/index.html', { pagination: await Order.getAll(req.query) });
```

```html
<!-- template -->
{{#each pagination.items}}
<tr><td>{{this.total}}</td></tr>
{{/each}} {{#if pagination.prev}}<a href="?page={{pagination.prev}}">Prev</a>{{/if}}
<span>{{pagination.page}} / {{pagination.totalPages}}</span>
{{#if pagination.next}}<a href="?page={{pagination.next}}">Next</a>{{/if}}
```

**Gotcha**: if this endpoint's `?page=` can be `all`, `getAll` resolves to a bare array instead — no `.items`, no `.page`/`.next`/`.prev` (see vulkano-backend-model § `getAll(props)` resolves to one of TWO different shapes). A view built for a normal paginated page will break (`pagination.items` is `undefined`) if a request hits it with `?page=all`. Either don't expose `page=all` on views that render pagination controls, or normalize the shape in the controller before calling `res.render`.

## SEO meta (public/crawlable views only)

Layout prints `res.locals.seo.*`, set by `app/config/middlewares/seo.js` and overridable per-route in the controller before `res.render`:

```html
<title>{{seo.title}}</title>
<meta name="description" content="{{seo.description}}" />
<link rel="canonical" href="{{seo.url}}" />
{{#if seo.noindex}}<meta name="robots" content="noindex, nofollow" />{{/if}}
```

Full convention (defaults, private-mode noindex, handoff checklist): [docs/SEO.md](../../../docs/SEO.md). A CMS/admin layout skips this block entirely — hardcode its `<title>` instead of interpolating `seo.*`.

## i18n

A `t(key, options)` helper is registered out of the box (`node_modules/@vulkano/core/views/helpers/t.js`, since `@vulkano/core@1.24.2`). It wraps `i18n.t(...)` as a plain callable function — required for Handlebars, since Handlebars helpers must be functions, not objects with methods (the raw `i18n` global doesn't work here). Call it directly, no controller wiring needed:

```html
{{t "welcome"}}
```

Fall back to passing a translated string as a local from the controller only if a view needs translation logic more complex than a single `t()` call:

```js
res.render('home/index.html', { welcome: i18n.t('welcome') });
```

```html
{{welcome}}
```

Locale files: `app/config/locales/<lang>.js`, keyed by filename, deep-merged with the core's own `en`/`es` defaults.

## Custom helpers — date/number/currency formatting

Not built in. Write one as a plain function and drop it in `app/config/views/helpers/<name>.js` (or `app/config/views/filters/<name>.js` — Handlebars has no separate filter concept, a file there registers exactly the same way as one in `helpers/`); auto-loaded, no registration code:

```js
// app/config/views/helpers/currency.js
module.exports = (amount, currency = 'USD') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0);
```

```js
// app/config/views/helpers/date.js
module.exports = (value, format = 'es-MX') =>
  value ? new Intl.DateTimeFormat(format, { dateStyle: 'medium' }).format(new Date(value)) : '';
```

Usage:

```html
{{currency product.price}} {{date order.createdAt}}
```

Reference implementations: `node_modules/@vulkano/core/examples/config/views/helpers/strpad.js` (multi-arg helper), `examples/config/views/filters/example.js` (filter-folder file, same registration), and the core's own always-loaded `vLowercase`/`vCamelCase` (`node_modules/@vulkano/core/views/filters/`). One file per formatter.

## Vite asset injection

Hash-argument syntax via triple-stash (helpers are wrapped so `{{{helper key=val}}}` calls `fn({ key: val })`, and a string return is auto-wrapped `SafeString`, so `{{{ }}}` alone is enough — no separate escape helper):

```html
{{{vite entry="app" type="style"}}}
<!-- in <head> -->
{{{vite entry="app" type="script"}}}
<!-- before </body> -->
```

`entry` must match a key in `vite.config.mjs`'s `build.rollupOptions.input` — use the entry name for the area this view belongs to (front vs CMS, see ARCHITECTURE.md § Multiple entry points).

## After writing

- New public/crawlable view → SEO handoff checklist (title/description/share-image) per SEO.md, and accessibility minimums (alt text, heading order, landmarks) per ACCESSIBILITY.md — unless the user opted the area out.
- Controller HTTP test for this view asserts on the rendered HTML body (see TESTING.md).
- Visual check in a browser (chrome-devtools MCP per AGENTS.md § Visual verification) — layout/styling issues aren't caught by `vp check`.

## Handoff

Report: view file(s) created/changed, controller-action it's rendered from, layout/partials reused, SEO/i18n applied (or explicitly not needed), and any locals the controller still needs to add (unresolved data).

## Reference

`docs/SEO.md`, `docs/ARCHITECTURE.md` (§ Multiple entry points), `docs/ACCESSIBILITY.md`, `app/views/_shared/templates/default.html` (reference layout), `app/config/views.js` (engine setting), `node_modules/@vulkano/core/bootstrap/engines/handlebars.js` (defaultLayout/partialsDir/helper wiring), `node_modules/@vulkano/core/views/helpers/vite.js` and `views/helpers/t.js` (built-in helper implementations), `node_modules/@vulkano/core/examples/config/views/config.js` (engine override template), `node_modules/@vulkano/core/examples/config/views/helpers/strpad.js` and `examples/config/views/filters/example.js` (custom helper templates).
