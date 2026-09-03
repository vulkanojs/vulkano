---
name: vulkano-backend-views
description: Use when deciding how a controller action in this Vulkano framework project should respond to a request — a server-rendered HTML view (res.render) vs a JSON API response (res.vsr) — and, for the HTML case, which template-engine skill (Nunjucks or Handlebars) to follow.
---

# Backend Views (dispatcher)

## Overview

A controller action produces one of two response shapes — pick based on what's consuming it, not habit:

- **`res.vsr(promise)`** — JSON, no template file, no view engine involved. `{ success, statusCode, data }` envelope. For an API endpoint (`app/controllers/api/*`) consumed by the Vue SPA, a socket handler, or an external client. Full convention: vulkano-backend-controller skill (§ View vs API response).
- **`res.render('folder/file.html', { ...locals })`** — HTML, rendered through a template engine, the crawlable surface for public pages (see SEO.md). For a page a browser navigates to directly.

If the answer is `res.vsr`, stop here — go to vulkano-backend-controller, nothing template-related applies.

If the answer is `res.render`, the actual template syntax (layout inheritance, partials, SEO locals, i18n, formatting helpers, Vite injection) depends on which engine the project uses — this skill doesn't teach that itself, it routes to the skill that does.

## What you can build under `app/views/`

- **Templates/layouts** (`_shared/templates/`) — base `<html>` shell every page wraps into.
- **Partials** (`_shared/partials/`) — reusable markup fragment included from 2+ views, instead of duplicating.
- **Error pages** (`_shared/errors/`) — 404/500 templates.
- **Views** (`<resource>/*.html`) — the actual page rendered per controller action.

Same four concepts in both engines — only the include/extend syntax differs. Go to the engine skill (below) for how to build each one.

## Which engine?

Check `app/config/views.js`:

| `app/config/views.js`  | Engine                  | Skill to use                     |
| ---------------------- | ----------------------- | -------------------------------- |
| absent                 | Nunjucks (core default) | vulkano-backend-views-nunjucks   |
| `engine: 'nunjucks'`   | Nunjucks                | vulkano-backend-views-nunjucks   |
| `engine: 'handlebars'` | Handlebars              | vulkano-backend-views-handlebars |

Both engine skills cover the same ground (file placement/naming, layout, `res.render` wiring, SEO meta, i18n, custom formatting helpers, Vite injection) for their own syntax — pick one, don't read both for a single view.

## Reference

vulkano-backend-controller (res.vsr/res.render split, routing, scaffold), vulkano-backend-views-nunjucks, vulkano-backend-views-handlebars, `app/config/views.js`.
