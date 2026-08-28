---
name: vulkano-frontend-component
description: Use when creating, editing, or reviewing a Vue component or view in this Vulkano framework project's client/ folder — .vue/.js/.scss file splitting, Composition API, views/ vs components/ placement, route↔view naming, Pinia store per concern, BEM styling, and CSS Grid layout.
---

# Frontend Component

## Overview
`client/` is a Vue 3 SPA (Composition API) bundled by Vite. Every component/view splits template, logic, and styles into sibling files — never a single-file `<script setup>` block with inline everything.

## When to use
- New view/component needed under `client/views/` or `client/components/`
- Adding/editing a Pinia store
- Wiring a new route
- Styling a component/view (BEM, grid)

Not for form validation UI — see vulkano-frontend-form. Not for route/auth-guard wiring — see vulkano-frontend-router. Not for analytics wiring — see vulkano-frontend-analytics. Not for accessibility — see vulkano-frontend-a11y. Not for backend — see vulkano-backend-* skills.

## Before implementing
- Composition API only (`setup()`, `ref`/`reactive`, composables) — never add `data()`/`methods`/`created()` options blocks.
- Decide `views/` (top-level route-driven state) vs `components/` (reusable, imported by views/other components).
- Check for an existing similar view/component — mirror its file layout instead of inventing a new one.

## File & naming

**Component** (`client/components/<Name>/`):
```
components/
  _index.scss              # aggregator — every component adds @import here
  MyComponent/
    MyComponent.vue         # template only
    MyComponent.js          # logic, imported via <script src="./MyComponent.js">
    _index.scss             # styles (BEM)
```

**View** (`client/views/<Path>/`) — leaf file always `Index.vue`/`Index.js`, folder name identifies the view:
```
views/
  _index.scss
  Users/Index.vue            # /users
  System/Users/Index.vue     # /system/users (nested route → nested folder)
```
A module folder (`System/`) gets its own `_index.scss` aggregator importing its children's, same pattern one level deeper.

Route path and view folder always mirror each other (kebab-case URL → PascalCase folder) — no code generates this, keep it by hand so a route is locatable without grepping.

Exception — resource+action routes (`/product/list`, `/product/create`, `/product/edit/:id`): the resource is the folder, each action is its own named file (`Product/List.vue`, `Product/Form.vue`) instead of an `Index.vue` per action-folder. Create and edit share one `Form.vue` (branch on `:id` presence: `GET` to prefill + `PUT` when editing, `POST` when creating) rather than separate `Create.vue`/`Edit.vue` files. See vulkano-frontend-router § Resource + action routes.

## Component/view skeleton
```js
// MyComponent.js
import { ref, onMounted, getCurrentInstance, toRef } from 'vue';

export default {
  setup(props) {
    const { $api } = getCurrentInstance().proxy || {}; // never `import Api` directly
    const sku = toRef(props, 'sku');
    const products = ref([]);

    onMounted(async () => {
      products.value = await $api.get('/product');
    });

    return { products, sku };
  }
};
```
```html
<!-- MyComponent.vue -->
<script src="./MyComponent.js"></script>
<template>
  <div class="my-component">...</div>
</template>
```
`$api` is a global property (`app.config.globalProperties.$api`), not an importable module — always pull it off `getCurrentInstance().proxy`.

## Routing
See vulkano-frontend-router for route wiring and the backend catch-all requirement.

## State — Pinia, one store per concern
`store/use<Entity>Store.js`, setup-style (not options-style), no barrel file:
```js
export const useEventStore = defineStore('event', () => {
  const { $api } = getCurrentInstance().proxy || {};
  const current = ref(null);
  async function fetch(id) { current.value = await $api.get(`/event/${id}`); }
  return { current, fetch };
});
```
Exception: app-shell-wide singleton state (loading spinner, socket status, sidebar) goes in one `useAppStore` — everything else stays split per entity.

## Layout — CSS Grid only
`display: grid` everywhere in `_index.scss`, never Flexbox. Use the responsive grid system (`client/scss/_grid.scss`): `.row` (`grid-template-columns: repeat(12, 1fr)`) + `.column.small-N.medium-N.large-N`.

## Styling — BEM
```scss
.my-component {
  display: grid;
  &__container { display: grid; }
  &--opened { /* state modifier */ }
}
```
Block name = component/view folder in kebab-case. No reaching into a child block's internals from a parent stylesheet.

## After writing
- Add the component's `@import './X/_index.scss';` line to the parent `_index.scss` aggregator.
- New store → test at `test/store/use<Entity>Store.test.js` (`createPinia()` + `setActivePinia()` in `beforeEach`, mock `$api` at the store boundary).
- Check analytics (vulkano-frontend-analytics) and accessibility (vulkano-frontend-a11y) requirements for the area before considering done.
- Visually verify in a browser per AGENTS.md § Visual verification.
- Run `vp check` and `vp test`.

## Reference
`docs/FRONTEND.md` (full detail), `docs/ARCHITECTURE.md`.
