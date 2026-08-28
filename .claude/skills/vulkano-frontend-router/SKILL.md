---
name: vulkano-frontend-router
description: Use when adding a Vue Router route, an auth/login guard, a route-based redirect, or a multi-entry-point (e.g. public front + CMS/admin) setup in this Vulkano framework project's client/ — route↔view naming, resource/action file naming, the SPA catch-all(s) on the backend, and fetching the current user (never caching it client-side).
---

# Frontend Router

## Overview
`client/routes.js` is a hand-written route array (Vue Router, HTML5 history mode). No auto-discovery of `views/`. Auth state is never cached client-side — every route change re-fetches the current user from the backend.

## When to use
- Adding a new route/view
- Adding a login/auth guard
- Any redirect-based access control (redirect to `/login` if unauthenticated, redirect away from `/login` if already authenticated)

Not for the view's own file layout — see vulkano-frontend-component. Not for the backend `AuthController`/JWT cookie setup — see docs/BACKEND.md § Authentication.

## Adding a route
```js
// client/routes.js
import { createRouter } from 'vue-router';

import Layout from '@client/layouts/Layout.vue';
import Homepage from '@client/views/Home/Index.vue';
import Users from '@client/views/System/Users/Index.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', component: Homepage },
      { path: '/system/users', component: Users }
    ]
  }
];

export default (history) => createRouter({ history, routes });
```
Route path and view folder mirror each other (kebab-case URL → PascalCase folder) — see vulkano-frontend-component for the full naming convention.

### Resource + action routes — `domain.com/<resource>/<action>`
When a route is a resource with multiple actions (`/product/list`, `/product/edit`), don't nest a new folder+`Index.vue` per action — that's a needless single-file subfolder per action. Instead the resource is the folder, and each action is its own named file inside it:

```
views/
  Product/
    List.vue / List.js / _list.scss
    Form.vue / Form.js / _form.scss
```
```js
{ path: '/product/list', component: () => import('@client/views/Product/List.vue') },
{ path: '/product/create', component: () => import('@client/views/Product/Form.vue') },
{ path: '/product/edit/:id', component: () => import('@client/views/Product/Form.vue') }
```

This only replaces the leaf filename — it does not apply to plain single-segment or nested-section routes (`/users`, `/system/users`), which keep the existing `Index.vue`/`Index.js` leaf convention (see vulkano-frontend-component). Use resource+action naming specifically when a folder holds more than one action for the same resource — it's what makes `domain.com/product/edit` map straight to `views/Product/Form.vue` without grepping.

### Create + Edit → one `Form.vue`, not `Create.vue`/`Edit.vue`
Don't split create and edit into two separate views — they're the same form, branching only on whether `:id` is present in the route. One `Form.vue` (routed from both `/product/create` and `/product/edit/:id`) avoids duplicating the whole form markup/validation across two files:

```js
// Form.js
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  setup() {
    const { $api } = getCurrentInstance().proxy || {};
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id; // undefined on /product/create
    const form = ref({ name: '', price: 0 });

    onMounted(async () => {
      if (id) form.value = await $api.get(`/product/${id}`); // getData for edit
    });

    async function submit() {
      if (id) {
        await $api.put(`/product/${id}`, form.value);
      } else {
        await $api.post('/product', form.value);
      }
      router.push('/product/list');
    }

    return { form, submit };
  }
};
```
Same rule applies to the backend controller (`PUT`/`POST` split on `:id`, not two controllers) — see vulkano-backend-controller.

## Backend catch-all — required for hard refresh

`app/config/routes.js` must keep a catch-all as its **last** entry so a hard refresh or direct URL hit on any client route returns the SPA's `index.html` instead of a 404:
```js
module.exports = {
  '/': 'HomeController.get',
  '/*': 'HomeController.get' // must stay last
};
```
Without it, every non-`/` client route 404s on hard refresh/direct URL while still working via in-app navigation — that split symptom (`<router-link>` works, refresh 404s) is the tell this is missing. Safe to keep last: convention API routes (`app/controllers/api/*`) register before `config/routes.js` entries, so `/*` never shadows an API route.

### Multiple entry points (e.g. a separate `/admin` CMS)

Not in use in this project yet — documented here for when a second Vite entry (a CMS/admin app, separate from the public front) is added (see docs/FRONTEND.md § Vite entry points). Each entry point is its own SPA and needs its **own** catch-all, scoped to its path prefix, registered **before** the generic `/*` so the more specific pattern isn't shadowed by it:
```js
module.exports = {
  '/': 'HomeController.get',
  '/admin/*': 'AdminController.get', // scoped catch-all for the CMS entry — must come before '/*'
  '/*': 'HomeController.get'          // public front catch-all — must stay last
};
```
`AdminController.get` renders the CMS entry's own `index.html`/template (its own `vite({ entry: 'admin' })` bundle, not the public front's `app` entry) — the two SPAs don't share a bundle just because they share the Express process.

## Auth guard — never cache user client-side
No `localStorage`/`sessionStorage` for the token or the user object — both are XSS-exposed. The JWT lives in an `httpOnly` cookie (set by the backend on login, see docs/BACKEND.md § Authentication); the frontend never reads or stores it directly.

Re-fetch the current user on every route change instead of caching it in a store across navigations:
```js
// client/routes.js (or a separate router/guards.js imported here)
router.beforeEach(async (to) => {
  const isAuthRoute = to.path === '/login';
  let user = null;
  try {
    user = await Api.get('/auth/me'); // 401 → rejects
  } catch (_err) {
    user = null;
  }

  if (!user && !isAuthRoute) return '/login';
  if (user && isAuthRoute) return '/';
  return true;
});
```
`GET /api/auth/me` (or `/api/auth/current`) is the backend's session-check endpoint — see docs/BACKEND.md § Authentication for the `AuthController` convention it expects (`login`/`logout`/`me` method keys).

## After writing
- Confirm the backend `/*` catch-all still exists if this is the first route added to a fresh project.
- Test hard-refresh on the new route, not just in-app navigation.
- Run `vp check` and `vp test`.

## Reference
`docs/FRONTEND.md` § Adding a route / SPA catch-all, `docs/BACKEND.md` § Authentication, AGENTS.md § Security considerations (session storage rules).
