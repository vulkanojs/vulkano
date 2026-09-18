# Routing — frontend routes, backend catch-all

Cross-cutting: applies to both `frontend/` (Vue Router routes) and `app/` (`app/config/routes.js` catch-all) work. See [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview and [BACKEND.md](BACKEND.md)/[FRONTEND.md](FRONTEND.md) for area code conventions.

**Before touching `app/config/routes.js` or an entrypoint's `routes.js`, load `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md`** — don't wire catch-alls from memory.

## Frontend routes — `frontend/<entrypoint>/routes.js`

Covered by `.claude/skills/vulkano-skills/vulkano-frontend-router/SKILL.md`: route wiring, route↔view naming (`Index.vue` for plain/nested routes, `Form.vue` for resource create+edit), auth guard/current-user fetching. That skill is the actionable one for adding a route — this file covers the backend half below, which the skill also documents but which is worth being self-sufficient here since it isn't frontend-only.

## Backend catch-all — required for hard refresh

Vue Router uses HTML5 history mode, so every client-side route inside a mounted SPA needs the server to return the same shell on a hard refresh or direct URL hit — otherwise Express 404s before Vue Router ever runs. `app/config/routes.js` needs a catch-all as its **last** entry for any area whose backend template actually mounts a Vue app (`id="app"` + `vite({ entry: '<name>' })`):

```js
module.exports = {
  '/': 'HomeController.get',
  '/*': 'HomeController.get' // must stay last
};
```

Without it, every non-`/` client route 404s on hard refresh/direct URL while still working via in-app navigation — that split symptom (`<router-link>` works, refresh 404s) is the tell this is missing. Safe to keep last: convention API routes (`app/controllers/api/*`) register before `config/routes.js` entries, so `/*` never shadows an API route.

**Only add a `/*` (or scoped `/<area>/*`) catch-all for an area that actually mounts a Vue app.** A fully server-rendered area (extending `_shared/templates/static.html` or similar, no Vue mount point) must **not** get a blanket `/*`: `@vulkano/core` already returns a real `404` via its built-in handler (`app/views/_shared/errors/404.html`) for any unmatched route in that area, and a catch-all there would intercept it and soft-200 every invalid URL into the homepage instead — wrong for SEO and for users. When adding the catch-all for a mounted area, always add both halves together, never one without the other:

1. **Backend**: the scoped (or generic) catch-all above.
2. **Frontend**: a Vue Router catch-all in that entrypoint's `routes.js` — `{ path: '/:pathMatch(.*)*', component: NotFound }`, rendering a `views/NotFound/Index.vue`, so an invalid path inside that area shows a real 404 UI instead of silently re-rendering the home route.

### Multiple entry points — scoped catch-alls

Each entrypoint beyond the public front (e.g. `/admin`) needs its own catch-all, scoped to its path prefix and registered **before** the generic `/*` so the more specific pattern isn't shadowed by it — see [ENTRYPOINTS.md](ENTRYPOINTS.md):

```js
module.exports = {
  '/': 'HomeController.get',
  '/admin': 'AdminController.get',

  // Scoped catch-all for the admin entry only — it mounts a Vue app
  // (app/views/_shared/templates/admin.html). No public '/*': the
  // public front is fully server-rendered Nunjucks (static.html, no
  // Vue mount point), so an invalid public URL should fall through to
  // @vulkano/core's built-in 404 handler instead of soft-200ing into
  // the homepage.
  '/admin/*': 'AdminController.get'
};
```

If a scoped catch-all goes missing once a mounted-SPA area's routes grow past one, every non-root client route in that area 404s on refresh while still working via in-app `<router-link>`/`router.push` navigation — same split symptom as above, scoped to that area. Full scaffold checklist for adding a brand-new entrypoint (including this wiring): `.claude/skills/vulkano-skills/vulkano-frontend-entrypoint/SKILL.md`.
