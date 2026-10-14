# Template changelog

The Vulkano template's changelog: changes to template-owned files (`AGENTS.md`, `references/`, the skills submodule) and the migrations they need in project-owned files. Overwritten from the template on sync; a project's own changes go in the root `CHANGELOG.md`. Read by the `vulkano-template-update` skill; agents don't load it for normal work.

Newest first. Every commit in the Vulkano template repo adds an entry here.

Entry format:

- `## YYYY-MM-DD — title`
- **Changed:** template-owned files added, removed, or changed.
- **Migration:** steps for project-owned files (`PROJECT.md`, `README.md`, `.env.example`). Write each as a condition plus an action ("if X, do Y") so it can be skipped when the project already satisfies it. Omit if none.

## 2026-10-14 — Changelog: drop empty Migration blocks

**Changed:**

- `references/CHANGELOG.md`: removed 15 **Migration** blocks that asked nothing of the project (`- None.`, or `None` plus a note that the template sync already covers it), per the entry format ("Omit if none"). `@vulkano/cli update` listed the annotated ones as pending migrations. Blocks with a conditional step for the project stay.

## 2026-10-14 — `vulkano-reviewer` subagent; type fixes

**Changed:**

- New `.claude/agents/vulkano-reviewer.md`: read-only review subagent; reads the rules docs for each changed area (`AGENTS.md` § Where to look), runs `vp check`/`vp test`, and judges what tools can't — layers, server-side auth, `res.render` vs `res.vsr`, test quality, `oxlint-disable` reasons, scope, changelog. One line per finding + verdict. On a seeded change it found 9/9 planted rule violations (generic reviewer: 6/9), no false positives on a clean change. `WORKFLOW.md` § Review: when to run it.
- `types/frontend.d.ts`: hand-written `ImportMeta.env` and `*.scss` replaced by `/// <reference types="vite-plus/client" />`.
- `test/conventions.test.js`: a service named like a core lib (overrides it) counts as declared via `types/vulkano.d.ts`. `BACKEND.md` § Autoload and libraries documents the override.

**Migration:**

- If `.claude/agents/vulkano-reviewer.md` is missing: copy it from the template.
- If `types/frontend.d.ts` declares `ImportMeta` or `*.scss` by hand: replace with the template's version.

## 2026-10-14 — Type-check the JS sources (checkJs)

**Changed:**

- New `tsconfig.json`: `allowJs` + `checkJs` + `strict` minus `noImplicitAny` (no emit), `target: ESNext` for `app/`, `frontend/`, `scripts/`. `vp check` (`typeCheck`), the `PostToolUse` hook and the editor now report type errors: missing modules, misspelled properties on typed APIs (Vue, Router, Pinia, Node), wrong argument counts, undeclared names. `test/` not included yet.
- New `types/vulkano.d.ts` (template-owned): `@vulkano/core` backend globals. New `types/frontend.d.ts` (template-owned): `*.vue`/`*.scss` modules, `import.meta.env`. New `types/app.d.ts` (project-owned): one `declare const <Name>: any;` per auto-loaded model/service and `bootstrap.js` global.
- `oxlint.config.mts` `globals`: added `Download`, `Jwt`, `mongoose`, `Upload`, `View` (core globals that were missing).
- `test/conventions.test.js`: every `app/models`/`app/services` file is declared in `types/app.d.ts`.
- `scripts/webp.js`: JSDoc on `walkDir` (strictNullChecks inferred `matchExtensions` as `null`).
- `ARCHITECTURE.md` lists `tsconfig.json` and `types/`; `BACKEND.md` § Autoload and libraries: declare new globals.

**Migration:**

- If `tsconfig.json` / `types/` are missing: copy `tsconfig.json`, `types/vulkano.d.ts`, `types/frontend.d.ts` and `types/app.d.ts` from the template, add `declare const <Name>: any;` to `types/app.d.ts` for every file in `app/models/` and `app/services/`, and any project global set in `app/config/bootstrap.js`. Run `vp check` and fix the type errors it reports (JSDoc for ambiguous defaults, as in `scripts/webp.js`).
- Merge the template's `globals` additions into the project's `oxlint.config.mts`.

## 2026-10-14 — Agent hook: lint the edited file in the same turn

**Changed:**

- New `.claude/settings.json` `PostToolUse` hook (`Edit|Write`) → `scripts/agent-check.js`: runs `vp check --fix` on the edited file (`.js/.mjs/.mts/.ts/.vue/.scss/.json` under `app/`, `frontend/`, `scripts/`, `test/`); remaining errors exit 2 so the agent sees them and fixes them before moving on. Tests: `test/scripts/agent-check.test.js`.
- `WORKFLOW.md` § Hooks: a hook error is a failed check. `ARCHITECTURE.md`: `scripts/agent-check.js` listed.

**Migration:**

- If `.claude/settings.json` lacks the `PostToolUse` hook: copy `scripts/agent-check.js` and `test/scripts/agent-check.test.js` from the template, then merge the template's `hooks.PostToolUse` entry into the project's `.claude/settings.json` without removing the project's own keys.

## 2026-10-14 — Architecture enforced by tests

**Changed:**

- `test/conventions.test.js` adds: `app/` holds only `config`/`controllers`/`models`/`services`/`views`; `frontend/` holds exactly one folder per `vite.entries.mjs` key (each entry file exists, no loose files); entrypoints hold only `scss`/`components`/`layouts`/`views`/`store`/`composables`/`utils`; PascalCase `components/` and `views/` folders (except `ui/`) and `store/use<Entity>Store.js`; every `app/models`, `app/services`, `app/config/middlewares`, `store/`, `composables/`, `utils/` file has its mirrored `.test.js`; no relative import between `app/` and `frontend/`.
- New `test/app/config/middlewares/seo.test.js` (the middleware had none).
- `ARCHITECTURE.md`: notes what the test enforces.

**Migration:**

- If the project's `test/conventions.test.js` lacks these cases: copy it from the template. If the project documents extra folders in `PROJECT.md`, add them to `APP_DIRS`/`ENTRYPOINT_DIRS`. Run `vp test` and add every missing test it reports (e.g. `test/app/config/middlewares/seo.test.js`, copy from the template).

## 2026-10-14 — AGENTS.md: mission, deployment is the user's call

**Changed:**

- `AGENTS.md`: new § Mission — deliver a professional working solution in readable, structured code (runs, follows conventions, has tests); deployment is out of scope.
- `AGENTS.md` § Where to look → Deploying: only when the user asks, mechanism from `PROJECT.md` § Deployment (TBD → ask; never pick one).

## 2026-10-14 — Lint/format config applied everywhere, conventions enforced

**Changed:**

- `.oxlintrc.json` and `.oxfmtrc.json` were never applied: `vp lint`/`vp fmt` and the editor's oxc extension (through the vite-plus wrapper) read only `vite.config.ts` `lint`/`fmt` — not `vite.config.mjs`, not the rc files. Now:
  - `vite.config.mjs` → `vite.config.ts` (`// @ts-nocheck`: `defineConfig` overloads fail type-checking because `vite` isn't linked at the root).
  - New `oxlint.config.mts` (old `.oxlintrc.json` content + `options`) and `oxfmt.config.mts` (old `.oxfmtrc.json` + `fmt`), imported as `lint`/`fmt`. Both rc files removed.
  - `curly` and `no-unused-vars` now actually fail (fixed in `scripts/clean.js`).
- New lint rules `no-restricted-globals` + `no-restricted-properties`: `confirm`/`alert`/`prompt` and their `window.*` versions are errors.
- New `test/conventions.test.js`: fails on `display: flex|inline-flex` in `frontend/**/*.{scss,vue}` (outside `ui/`) and on any `app/controllers/**/<Name>Controller.js` (outside `sockets/`) without `test/app/controllers/**/<Name>.http.test.js`.
- `FRONTEND.md` (§ UI library, § CSS) and `BACKEND.md` (§ Controllers) note what enforces each rule; `FRONTEND.md` § UI library: unavoidable use → per-line `oxlint-disable-next-line` with a reason, never per-file. `vite.config.mjs` → `vite.config.ts` in `AGENTS.md`, `ARCHITECTURE.md`, `BUILD.md` and the skills submodule.

**Migration:**

- If the project has `vite.config.mjs`: rename it to `vite.config.ts`, add the template's `// @ts-nocheck` header, and type `outputOptions(singleEntry: boolean)`.
- If `oxlint.config.mts` / `oxfmt.config.mts` are missing: copy them from the template and merge in the project's own `.oxlintrc.json` / `.oxfmtrc.json` values and the `lint.options` / `fmt` of its Vite config. In `vite.config.ts` import both (`import fmt from './oxfmt.config.mts'`, `import lint from './oxlint.config.mts'`) and replace the `fmt: { … }` and `lint: { … }` blocks with `fmt,` and `lint,`. Delete `.oxlintrc.json` and `.oxfmtrc.json`. Run `vp check --fix`, then fix what `vp lint` still reports.
- If `test/conventions.test.js` is missing: copy it from the template. If `PROJECT.md` overrides the layout system to allow Flexbox, delete its Flexbox case. Run `vp test` and add any missing controller test it reports.

## 2026-10-13 — Template sync moves to `npx @vulkano/cli update`

**Changed:**

- New `@vulkano/cli` 1.0 command `update`: syncs `AGENTS.md`, `references/`, the skills submodule, `.env.example` keys and `@vulkano/core` with `master` of the template; creates `PROJECT.md` only if missing; records the synced sha in `.vulkano.json`.
- Skills submodule: `vulkano-template-update` now runs the CLI and only handles migrations and kept local edits.
- `CHANGELOG.md` stub: the next sync's base lives in `.vulkano.json`.

**Migration:**

- Run `npx @vulkano/cli update` in the project root and commit the result (including `.vulkano.json`).

## 2026-10-13 — model skill: `delete` is an update

**Changed:**

- Skills submodule: model skill's hand-written `delete` is back to `return this.update(_id, { active: false })` — a soft delete is an update (its hand-written `update` doesn't filter by `fillable`). The core scaffold's own `delete` keeps its direct write (its inherited `update` applies `fillable`).

## 2026-10-13 — docs/skills consistency pass

**Changed:**

- `FRONTEND.md`:
  - `_index.scss` stays the entry and may import partials (`_list.scss`, `_form.scss`);
  - `.is-loading` and the `flash` transition are examples, created once in `_base.scss`;
  - store example no longer lists the current user;
  - guard imports `./Api`;
  - `createWebHistory` lives in `app.js`.
- `BACKEND.md`: page controllers (`Home`, `Admin`) stay singular; robots meta is `noindex, nofollow`.
- `ARCHITECTURE.md`:
  - `settings.js` has no salt by default;
  - `vite.js` listed;
  - sockets/locales/`components/ui` marked optional;
  - `test/scripts/`.
- `BUILD.md`: alias is `@<folder>`; per-entry build.
- Template SCSS: NotFound, HelloWorld and the Home cheatsheet use design tokens (were raw values).
- `.env.example`: `TEST_PORT`, `TEST_MONGO_URI` (commented).
- `test/webp.test.js` → `test/scripts/webp.test.js`.
- Skills submodule:
  - controller: module folder = URL prefix, `Product` pointer;
  - template-update: exact version pin, old section name example;
  - model: mixin sources;
  - testing: `config/middlewares/`, `scripts/`, sockets, `Api.test.js`;
  - store: list-store example;
  - component: design-system bullets in their section, Flexbox override;
  - entrypoint: admin layout keeps title + noindex, above/below, `@<folder>`, `environments`;
  - router: resource `_index.scss` + partials;
  - form: loader/transition created once;
  - `README.es.md` "una skill".

## 2026-10-13 — skill snippets that failed or leaked

**Fixed (skills submodule):**

- model:
  - hand-written `delete` writes `active: false` directly (not via an `update` that applies `fillable`);
  - `create` strips `select: false` paths;
  - `getExample` filters `active: true`;
  - populate section no longer claims `?populate=user:password` leaks (core 2.1.6 sanitizes it).
- controller: `'get edit :id'` registered `/products/edit` without `:id` → `'get edit/:id'`, with a 404 on a missing record; `/products` paths.
- auth: `getCurrent` answered 404 (via `getUser`/`getByField`) for a missing/inactive user → `findOne({ _id, active: true })`, 401.
- entrypoint: new-entrypoint scaffold lists `scss/`, `views/{Home,NotFound,DesignSystem}` (`style.scss` doesn't build without `scss/`); `Api.js` never shared.
- router/entrypoint: NotFound is the last **child** of the `Layout` route (`:pathMatch(.*)*`), as shipped.
- form: login skeleton gets the password field its rules already required.
- component: `.items ?? []`; `Api` import by relative path (`../Api`, `./Api` from `routes.js`).
- router: `Form.js` example has loading + error handling, points to the form skill.

**Changed:**

- `references/AGENTS/FRONTEND.md` § Routes: NotFound is the last child of `Layout`.
- `references/AGENTS/FRONTEND.md` § Code organization + entrypoint skill: entrypoints never share code — no `frontend/shared/` (the skill used to recommend it).

**Migration:**

- None for code. Projects that copied the old model `delete`/`create`, the auth `getCurrent` or the `'get edit :id'` key should apply the same fixes.

## 2026-10-13 — `useFormValidation` keeps `''` for a valid field

**Fixed:**

- Skills submodule: form skill's `useFormValidation` stored the validator's `null` in `fieldErrors` for a valid field (init and `clearError` use `''`) — now `''` always.

**Migration:**

- Project copies of `composables/useFormValidation.js`: `error = validator(formData[field]) || '';`.

## 2026-10-13 — `@vulkano/core` 2.1.6

**Changed:**

- `pnpm-workspace.yaml`: `@vulkano/core` pinned to `2.1.6` (was `2.1.2`), lockfile regenerated.
- Core 2.1.6 brings:
  - `?fields=` / `?populate=rel:fields` can no longer select `select: false` paths (security);
  - scaffold `delete` soft-deletes even when `fillable` omits `active`;
  - scaffold `create` no longer echoes hidden fields;
  - `get<Model>(id, props)` populates;
  - the view engine is read from `config/views.js`;
  - `res.vsr` resolving `null` works.

**Migration:**

- `pnpm install`. Code that used the value resolved by a scaffold `create` as a Mongoose document (`.save()` on it) must re-fetch it — it's a plain object now.

## 2026-10-13 — list views render loading/error/empty/data

**Added:**

- `references/AGENTS/FRONTEND.md` § Design patterns: every list/fetched view renders loading, error (`err.message` + retry), empty and data; reads `.items` (bare array only with `?page=all`).
- Skills submodule: component skill § List view — 4 states snippet; skeleton reads `.items` from `getAll` (was assigning the page object to the list).

## 2026-10-13 — layouts and composables defined

**Added:**

- `references/AGENTS/FRONTEND.md` § Code organization: `layouts/` = the SPA's page template (header/nav/footer around `<router-view />`, parent `component` in `routes.js`); composable = reusable component logic like form validation (`useFormValidation`), own state per call — shared state → store, no reactivity → `utils/`.

**Changed:**

- `frontend/website/layouts/Layout.js`: removed the unused `loading` ref.

## 2026-10-13 — store vs `$api` rule

**Added:**

- `references/AGENTS/FRONTEND.md` § Store: one-view data → `$api` in the view; data shared by 2+ components/views or kept across navigation → store actions, never `$api` for the same data (was only in the store skill's overview).

## 2026-10-13 — `Api.js` rejects with one error shape

**Changed:**

- `frontend/website/Api.js`, `frontend/admin/Api.js`: a failed request rejects with an `Error` — `message` = the `res.vsr` envelope's `error.detail` (what the backend threw), plus `status`, `code`, `name`, `data`; network failure → `status: 0`, `NetworkError`. Used to reject with the raw `Response` (non-2xx) or a `TypeError` (network). Tests: `test/frontend/<entrypoint>/Api.test.js` (shared cases in `test/helpers/apiSuite.js`).
- `references/AGENTS/FRONTEND.md` § Code organization: rejection shape; each entrypoint keeps its own `Api.js`.
- Skills submodule: form skill shows `err.message` in the flash instead of a fixed text.

**Migration:**

- Code that read the rejected `Response` (`await err.json()`, `err.status` on a `Response`) → use `err.message` / `err.status` / `err.data` directly.

## 2026-10-13 — config layering documented

**Added:**

- `references/AGENTS/BACKEND.md` § Config: `app/config/<section>.js` → `app.config.<section>`, deep-merged with `env/<NODE_ENV>/` (or `env/<NODE_ENV>.js`) and gitignored `local.js`, last wins. Secrets only in `.env`. "Shared constants" moved here from § Autoload. `ARCHITECTURE.md` tree lists `env/` and `local.js` as optional, not shipped.

## 2026-10-13 — scaffold `create` writes the whole body

**Changed:**

- `references/AGENTS/BACKEND.md` § Scaffold: `fillable` stays update-only; the inherited `create` writes the whole body, so a model with privileged fields doesn't expose `post` through the scaffold (own `create` in the model).

**Migration:**

- Needs `@vulkano/core` with the scaffold `delete`/`create` fixes (2.1.6+): older core leaves records active on `DELETE` when `fillable` omits `active`, and echoes `select: false` fields from `POST`.

## 2026-10-13 — `getAll` props rule, secrets via `select: false`

**Changed:**

- `references/AGENTS/BACKEND.md` § Models: `props` is `req.query` (untrusted) — build `filter` from named keys, never spread `props`/`props.filter`. Secrets → `select: false`; the core drops them from `?fields=` and `?populate=rel:fields` (replaces "`select: false` does not protect fields from `?populate=`").
- Skills submodule: model skill shows the unsafe spread as a never, and notes `_sanitizeFields` on `?fields=`.

**Migration:**

- Requires `@vulkano/core` with `_sanitizeFields` (2.1.6+). Older core: `?fields=+password` returns the hash — never expose `getAll(req.query)` on a model with secrets until upgraded.

## 2026-10-13 — `res.vsr(async fn)` documented

**Added:**

- `references/AGENTS/BACKEND.md` § Controllers: `res.vsr` accepts an async function — no `try`/`catch` in controllers.
- Skills submodule: controller skill shows the async pattern for orchestrating several model calls (`return VSError.notFound(...)`, not `throw`, since it's a rejected Promise); stale "Nunjucks or Handlebars skill" pointer now names `vulkano-backend-templates`.

## 2026-10-13 — scaffold `subdocs` documented

**Added:**

- `references/AGENTS/BACKEND.md` § Scaffold: rule line for `subdocs` (CRUD routes for embedded array fields, off by default).
- Skills submodule: controller skill shows the `subdocs` config and the routes it registers (404 unknown key, 405 method not allowed).

## 2026-10-13 — sitemap.xml is project-owned, not shipped

**Changed:**

- `references/AGENTS/BACKEND.md` § SEO wiring, `ARCHITECTURE.md`: `public/sitemap.xml` is not part of the template — each project creates it by hand or with a script/service that regenerates it; agents don't create or edit it unless asked (docs used to describe it as shipped).
- Skills submodule: controller/templates skills no longer ask to add each view to the sitemap.

## 2026-10-13 — nodemon watches only the backend

**Changed:**

- `nodemon.json`: explicit `watch` (`app/`, `app.js`, `.env`) and `ext` (`js,json,env`) instead of an ignore list — edits to `.claude/`, `.superpowers/`, `vite.config.mjs`, `package.json` or docs no longer restart Express; `.env` changes now do. Templates (`.html`) reload through the view engine's own watch, no restart.
- `references/AGENTS/ARCHITECTURE.md`, `BUILD.md`, `DEVTOOLS.md`: describe the new watch list.

**Migration:**

- Replace `nodemon.json`'s `ignore` with the `watch` + `ext` above.

## 2026-10-13 — Design system per entrypoint: tokens, base styles, /design-system page

**Added:**

- `frontend/<website|admin>/scss/_tokens.scss`: CSS custom properties for colors (light/dark), typography, spacing, radii.
- `frontend/<website|admin>/scss/_base.scss`: links, buttons, inputs, `.field-required` built on the tokens (admin gets it for the first time).
- `frontend/<website|admin>/views/UI/`: `/design-system` page — color swatches, type scale, spacing/radii, base components, grid demo. Registered only when `import.meta.env.DEV` (dynamic import, dropped from production builds).
- `frontend/admin/scss/_grid.scss`: copy of the website grid, imported in `admin/style.scss`.

**Changed:**

- `style.scss` (both): uses the tokens instead of raw values.
- `references/AGENTS/FRONTEND.md` (new § Design system), `ARCHITECTURE.md` tree; skills `vulkano-frontend-css`, `-component`, `-form`: tokens/base/`/design-system` now ship in the template.

**Migration:**

- Optional: copy `scss/_tokens.scss`, `scss/_base.scss` and `views/DesignSystem/` into each entrypoint, add the dev-only `design-system` route, and replace raw colors/sizes with `var(--token)`.

## 2026-10-13 — NotFound route in both entrypoints, catch-alls enabled

**Changed:**

- `frontend/website` and `frontend/admin`: new `views/NotFound/` (Vue + JS + BEM SCSS) and a `:pathMatch(.*)*` child route under each `Layout` — the template now follows its own "every Vue entrypoint has a NotFound route" rule.
- `app/config/routes.js`: `'/admin/*'` and `'/*'` catch-alls enabled (both areas mount a Vue app).
- `scripts/clean.js` + test: strip the now-active `'/admin/*'` line.
- `references/AGENTS/BACKEND.md` § Routes: a non-existent `/api` URL gets the SPA's HTML (200) once `'/*'` is active.

**Migration:**

- Projects without a NotFound route: copy `views/NotFound/` and the route; enable the catch-all of each Vue area in `app/config/routes.js`.

## 2026-10-13 — Template SCSS follows its own CSS rules

**Changed:**

- `frontend/website/style.scss`: `body` grid instead of flex, `100dvh`, `h1` `3.25rem`, no `.card`; imports new `scss/_base.scss`.
- `frontend/website/scss/_base.scss` (new): shared `a`/`button` base styles (hover, `cursor: pointer`, disabled) in `rem` — replaces the scss-only `components/Buttons/` folder (deleted).
- `frontend/website/components/HelloWorld`: BEM (`.hello-world__title`, `__card`) instead of a bare `h1`.
- `frontend/website/views/Home/_index.scss`: whole-pixel `rem` only, no `em`.
- `frontend/admin/style.scss`: `100dvh`.

**Migration:**

- None required; projects still on the demo styles can copy these files.

## 2026-10-13 — AGENTS.md slimmed (102 → ~50 lines)

**Changed:**

- `AGENTS.md`: removed § Minimum rules (`references/AGENTS/` is tracked in the project, only the skills submodule can be missing — the references already state every rule); merged Git/Plans pointers into § Where to look; Quick workflow + handoff checklist + "do only what was asked" merged into § Workflow; Code principles collapsed to two lines; Security/Safety trimmed. New dispatch lines: cron (BACKEND.md), deploy/launch (PROJECT.md § Deployment + SEO flip), missing submodule (`git submodule update --init`).
- Skills submodule READMEs: fallback is the project's references, not "§ Minimum rules".

**Migration:**

- None (template update overwrites `AGENTS.md`). Projects that edited AGENTS.md locally: move project facts to `PROJECT.md`.

## 2026-10-13 — Catch-all rule in one place

**Changed:**

- The SPA catch-all rule lived in 6 places. Now: rule only in `references/AGENTS/BACKEND.md` § Routes (adds the "hard refresh 404s" symptom); code only in skill `vulkano-frontend-entrypoint` § Wiring; skill `vulkano-frontend-router` keeps just the frontend `NotFound` snippet + links (~30 lines less); `BUILD.md` links to BACKEND.md; `app/config/routes.js` comment cut to 2 lines + link.

**Migration:**

- Optional: replace the long catch-all comment in `app/config/routes.js` with the 2-line version.

## 2026-10-13 — Nunjucks + Handlebars skills merged into vulkano-backend-templates

**Changed:**

- Skills submodule: `vulkano-backend-views-nunjucks` and `vulkano-backend-views-handlebars` (≈370 lines, ~60% identical) replaced by one `vulkano-backend-templates` (~135 lines) — shared rules once, engine syntax side by side. `vulkano-backend-views` stays as the render/vsr/View.render decision and points to it. `plugin.json`, READMEs and cross-skill links updated.
- `references/AGENTS/BACKEND.md` § Views, `BUILD.md`: point to `vulkano-backend-templates`.

## 2026-10-13 — Docs cleanup: stale descriptions, dead pointers, version history

**Changed:**

- Skills submodule: entrypoint description drops the removed area decision and nodemon, adds rename/remove; router skill drops the missing `static.html` and uses the real `vite()` call; version history (core 1.24/1.25) and `Paginate.js` line numbers removed; controller/model handoff no longer repeat `vp check`/`vp test`; entrypoint "Router base path" is a real heading (linked from the router skill).
- `CHANGELOG.md`, `vite.entries.mjs`, `test/helpers/bootstrap.js`: pointers to removed/never-existing files fixed.
- `references/AGENTS/BACKEND.md` § SEO wiring, `FRONTEND.md` § Analytics wiring: dropped the "(public areas only)" qualifier — no area table defines it anymore.

## 2026-10-13 — Testing skill: useFormValidation signature

**Changed:**

- Skills submodule (`vulkano-testing`): composable example uses the real signature `useFormValidation(rules).validate(formData)` → boolean (was `useFormValidation(model, rules).validate(cb)`, which doesn't exist).

## 2026-10-13 — Router auth guard: meta.auth, inside the routes.js factory

**Changed:**

- Skills submodule (`vulkano-frontend-router`): auth guard rewritten — lives inside the `routes.js` factory (the old snippet called `router.beforeEach` where no `router` exists), imports `Api`, two variants — `meta: { auth: true }` for mixed public/private entrypoints, or guard every route except `/login*` for an entrypoint fully behind login (admin); `/login*` via `startsWith` covers 2FA/forgot sub-routes. States the guard is UX; the API enforces auth.
- `references/AGENTS/FRONTEND.md` § Routes: same rule.

**Migration:**

- Guards that check every route: add `meta: { auth: true }` to protected routes (or their `Layout`) and skip the rest.

## 2026-10-13 — Stores import Api, no getCurrentInstance

**Changed:**

- `references/AGENTS/FRONTEND.md`: components use `$api` from `getCurrentInstance().proxy`; stores, composables, utils and router guards `import Api` (no component instance there).
- Skills submodule: `vulkano-frontend-store` example imports `Api` (the old `getCurrentInstance().proxy` crashed when a store was first used from a router guard/socket client, and pinned the first caller's instance); drops the "survives a full reload" claim. `vulkano-frontend-component` and `vulkano-testing` (mock `Api.js` with `vi.mock`) aligned.

**Migration:**

- Stores using `getCurrentInstance()` → `import Api from '../Api'`; their tests mock `Api.js` with `vi.mock`.

## 2026-10-13 — Admin layout: no SEO, title set per controller

**Changed:**

- `app/views/_shared/templates/admin.html`: only `<title>{{ seo.title }}</title>` + fixed `noindex, nofollow` — no description/canonical/og (unchanged markup, now documented).
- `app/controllers/AdminController.js`: default title `VulkanoJS - Admin` (was `Vulkano App — Admin`); any admin controller may override it.
- `test/app/controllers/Admin.http.test.js`: asserts the title and no `og:` tags.
- `references/AGENTS/BACKEND.md` § SEO wiring + skills `vulkano-backend-views-nunjucks`/`-handlebars`: CMS/admin layouts carry no SEO besides the title (docs said "prints none" / "hardcode the title").

**Migration:**

- None required. Optionally rename the admin title in `AdminController` (`VulkanoJS - Admin`) to `<Project> - Admin`.

## 2026-10-13 — routes.js: drop redundant /admin entry

**Changed:**

- `app/config/routes.js`: removed `'/admin': 'AdminController.get'` — convention already routes `GET /admin` to `AdminController.get`, and the template was breaking its own "never duplicate a convention route" rule.
- `scripts/clean.js` + `test/clean.test.js`: no longer strip that line.

**Migration:**

- Optional: delete `'/<area>': '<Area>Controller.get'` entries in `app/config/routes.js` whose controller has a plain `get` method — convention serves them. Keep scoped catch-alls (`'/<area>/*'`).

## 2026-10-13 — Auth: skill rewritten against working wiring

**Changed:**

- Skills submodule (`vulkano-backend-auth`): rewritten. `Auth` model + `User` model (bcrypt + `SALT_KEY`, `password` `select: false`, hash only when modified), `express/jwt.js` enabled with `ignore`, `middlewares/auth.js` decrypting `req.auth`, controller passing the promise to `res.vsr` (no hanging request), token `expiration` = cookie `maxAge`, `secure`/`sameSite` cookie. Old example never logged anyone in (no `expiration`, read `req.user`).
- `references/AGENTS/BACKEND.md` § Auth: rules match the skill; `Encrypter` marked as reversible, never for passwords.
- `AGENTS.md` minimum rules: empty `JWT_SECRET_KEY` with jwt enabled stops the server from booting (was "login returns 500").
- `.env.example`: `COOKIES_SECRET_KEY` comment no longer points to the auth skill.

**Migration:**

- Projects that copied the old auth skill: if `AuthController` reads `req.user` or `Jwt.encode` has no `expiration`, follow the new skill (add `app/config/middlewares/auth.js`, encode `expiration`).

## 2026-10-13 — Docs consolidation: skills = code, references = rules

**Changed:**

- `references/AGENTS/`: 22 docs → 6. `ARCHITECTURE.md` (what is what), `BACKEND.md` (controllers, scaffold, models, auth, views, autoload/libraries, config, routes, SEO wiring, security), `FRONTEND.md` (components, UI library, store, forms, routes, CSS, microinteractions, assets, analytics wiring), `BUILD.md` (entrypoints + Vite), `DEVTOOLS.md` (+ LAN/WSL), `WORKFLOW.md` (git + plans). Each holds short rules and names the skill with the worked code — no text repeated in both.
- Removed: `ACCESSIBILITY.md`, `ANALYTICS.md`, `AREAS.md`, `ASSETS.md`, `CONFIG.md`, `CSS.md`, `DEVTOOLS-LAN.md`, `ENTRYPOINTS.md`, `GIT.md`, `LAUNCH.md`, `MICROINTERACTIONS.md`, `PLANS.md`, `ROUTING.md`, `SEO.md`, `STORE.md`, `TESTING.md`, `UI.md`, `VITE.md`.
- `AGENTS.md`: area dispatch points to the 6 docs + skills; § Per-area requirements and § Launch removed.
- `PROJECT.md`: SEO/Analytics/Accessibility per-area table removed — general-purpose SEO/a11y/analytics skills do that job better; Vulkano-specific wiring (`res.locals.seo`, `SEO_NOINDEX`, robots/sitemap, vue-gtag) is now a few rules in BACKEND.md/FRONTEND.md.
- `scripts/clean.js`: no longer edits the per-area table.
- Skills submodule: `vulkano-seo`, `vulkano-frontend-a11y`, `vulkano-frontend-analytics` removed (14 skills); links in the rest point to the new docs; `vulkano-template-update` drops the old table on migration.

**Migration:**

- Delete the removed `references/AGENTS/*.md` files listed above (template update step 6 does this).
- `PROJECT.md`: if it has § "Project requirements — SEO / Analytics / Accessibility", delete that section (keep the other sections and their values). Pointers to `references/AGENTS/UI.md` or the css skill in § Frontend conventions → `references/AGENTS/FRONTEND.md` § UI library / § CSS.
- `.env.example`: `SITE_URL` comment now points to `references/AGENTS/BACKEND.md` § SEO wiring.
- Project files that mention removed docs (e.g. `public/robots.txt`, `test/helpers/bootstrap.js`, `frontend/**/scss/_grid.scss`, `README.md`): repoint to BACKEND.md/FRONTEND.md/BUILD.md or skill `vulkano-testing`.

## 2026-09-21 — T07 sitemap fixes: AGENTS.md dispatch, routes.js comment, SITE_URL

**Changed:**

- `AGENTS.md` § Area conventions: a new public/crawlable page (a page a browser navigates to directly) now routes to skills `vulkano-backend-views` and `vulkano-seo` **before** any `frontend/` skill, so the decision between a server-rendered view and a Vue SPA route happens first — was defaulting to `frontend/` and building an unwanted SPA route for an SEO-facing page.
- `app/config/routes.js`: the Vue Router catch-all comment now says explicitly it only applies to a `frontend/` entrypoint, not a plain server-rendered page — the old wording was ambiguous enough to be read as "uncomment this to add any new page."
- `.env.example`: `SITE_URL` documented as an optional, recommended var — absolute base for `sitemap.xml`/`robots.txt` once a domain is known.
- Skills submodule (`vulkano-seo`): never skip `public/sitemap.xml` for a missing domain (fall back to relative URLs) or because the project is still in the noindex/private-mode default.

## 2026-09-20 — Minimum rules block in AGENTS.md

**Changed:**

- `AGENTS.md`: new § "Minimum rules (if `references/` or the skills are missing)" — no native dialogs, `useFormValidation`, thin controllers, scoped catch-all + NotFound, mirrored tests, grid + whole-pixel `rem`, non-empty `JWT_SECRET_KEY` when adding auth, `_` prefix. Applies only when `references/AGENTS/` and the skills submodule are absent.

## 2026-09-20 — Scope rule, catch-all guidance, skill checklists

**Changed:**

- `AGENTS.md` § Safety boundaries: do only what was asked; if the user says they will build a piece, note the contract in the handoff instead of building it.
- `app/config/routes.js`: comment now says every area that mounts a Vue app needs its scoped catch-all plus a NotFound route in its frontend `routes.js`, even with a single route.
- Skills submodule: `vulkano-frontend-css` gains a whole-pixel `rem` table; `vulkano-frontend-entrypoint`, `vulkano-backend-model`, `vulkano-backend-auth` and `vulkano-seo` end with hard `[ ]` checklists.

**Migration:**

- If `app/config/routes.js` still says "Uncomment once each area has more than one route", replace that sentence with the new comment.
- If an area mounts a Vue app without a scoped `'/<name>/*'` catch-all before `'/*'`, or without a `NotFound` route in its `routes.js`, add both.

## 2026-09-20 — Pinned dependencies, core 2.1.2, all skills registered

**Changed:**

- `pnpm-workspace.yaml`: `@vulkano/core` pinned to `2.1.2` (was `^2.1.1`); `vite`, `vitest`, `vite-plus` pinned to `0.3.3` (were `@latest` / `^0.3.2`); dependency policy comment added.
- `pnpm-lock.yaml`: regenerated so it matches the catalog. It was stale, so any `pnpm <script>` re-installed and ran `postinstall`.
- `@vulkano/core` 2.1.2 fixes unmatched routes returning 500 instead of 404 when `NODE_ENV=production`.
- Skills submodule: `plugin.json` registers `vulkano-frontend-css`, `vulkano-frontend-store` and `vulkano-template-update` (17 of 17).

**Migration:**

- If `pnpm-workspace.yaml` has `vite`/`vitest` as `@latest` or `@vulkano/core` as a range, pin them to the exact versions above.
- If `pnpm-lock.yaml` does not match `pnpm-workspace.yaml`, run `pnpm install --lockfile-only --ignore-scripts` and commit it.
- If the project runs in production, run `pnpm install` to get `@vulkano/core` 2.1.2.

## 2026-09-18 — Lower per-task agent context

**Changed:**

- `AGENTS.md`: skill-first rule (invoke the skill, read the `references/AGENTS/` doc only if the submodule isn't installed); `@vulkano/core` README read on demand; `ARCHITECTURE.md` read only when creating files or folders; new triggers for `UI.md`, `ENTRYPOINTS.md`; superpowers plan rules moved to `PLANS.md`; env vars point to `.env.example`.
- `references/AGENTS/`: new `ENTRYPOINTS.md`, `PLANS.md`, `CSS.md`, `MICROINTERACTIONS.md`, `CONFIG.md`, `DEVTOOLS-LAN.md`; sections split out of `ARCHITECTURE.md`, `FRONTEND.md`, `BACKEND.md`, `DEVTOOLS.md`; `ASSETS.md` gets a read trigger. Removed the env vars block from `ARCHITECTURE.md`.
- Opt-outs for SEO/Analytics/Accessibility are decided only by the `PROJECT.md` area table; `SEO.md`, `ANALYTICS.md`, `ACCESSIBILITY.md` and the frontend handoff checklist defer to it.
- `references/CHANGELOG.md` (this file) is new, and `references/AGENTS/GIT.md` gets the rule that every commit adds a changelog entry (root `CHANGELOG.md` in a project, this file in the template repo); root `CHANGELOG.md` is a new project-owned stub.
- `.env.example`: `COOKIES_SECRET_KEY` comment.
- Skills submodule: pointers repointed to `ENTRYPOINTS.md` / `CSS.md`; form skill uses `useFormValidation` (synchronous `validate(form)`, `clearError`), submits with `@submit.prevent="submit"` and shows a flash message on error; new `vulkano-template-update` (also checks for and updates `@vulkano/core`).

**Migration:**

- `PROJECT.md` § Deployment: if it still holds the pasted option catalog (bullets for `ecosystem.config.js`, `Dockerfile`, `docker-compose.yml`, Coolify), replace it with the CI/CD line plus a `| Environment | Mechanism |` table listing only the mechanism(s) the project actually uses per environment (staging, production).
- `PROJECT.md` area table: if `frontend/admin/` no longer exists but an `/admin` row remains, remove the row. Old versions of `scripts/clean.js` edited `AGENTS.md` instead of `PROJECT.md` and left it behind.
- Existing forms that call `useFormValidator(form, rules)` keep working; the sync does not rewrite project code. New forms follow the skill's `useFormValidation(rules)` pattern.
