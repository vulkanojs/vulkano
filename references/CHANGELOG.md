## 2026-09-21 — T07 sitemap fixes: AGENTS.md dispatch, routes.js comment, SITE_URL

**Changed:**

- `AGENTS.md` § Area conventions: a new public/crawlable page (a page a browser navigates to directly) now routes to skills `vulkano-backend-views` and `vulkano-seo` **before** any `frontend/` skill, so the decision between a server-rendered view and a Vue SPA route happens first — was defaulting to `frontend/` and building an unwanted SPA route for an SEO-facing page.
- `app/config/routes.js`: the Vue Router catch-all comment now says explicitly it only applies to a `frontend/` entrypoint, not a plain server-rendered page — the old wording was ambiguous enough to be read as "uncomment this to add any new page."
- `.env.example`: `SITE_URL` documented as an optional, recommended var — absolute base for `sitemap.xml`/`robots.txt` once a domain is known.
- Skills submodule (`vulkano-seo`): never skip `public/sitemap.xml` for a missing domain (fall back to relative URLs) or because the project is still in the noindex/private-mode default.

**Migration:**

- None. Pull the new `AGENTS.md`, `app/config/routes.js`, and `.env.example`; no project files change.

## 2026-09-20 — Minimum rules block in AGENTS.md

**Changed:**

- `AGENTS.md`: new § "Minimum rules (if `references/` or the skills are missing)" — no native dialogs, `useFormValidation`, thin controllers, scoped catch-all + NotFound, mirrored tests, grid + whole-pixel `rem`, non-empty `JWT_SECRET_KEY` when adding auth, `_` prefix. Applies only when `references/AGENTS/` and the skills submodule are absent.

**Migration:**

- None. Pull the new `AGENTS.md`; no project files change.

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

# Template changelog

The Vulkano template's changelog: changes to template-owned files (`AGENTS.md`, `references/`, the skills submodule) and the migrations they need in project-owned files. Overwritten from the template on sync; a project's own changes go in the root `CHANGELOG.md`. Read by the `vulkano-template-update` skill; agents don't load it for normal work.

Newest first. Every commit in the Vulkano template repo adds an entry here.

Entry format:

- `## YYYY-MM-DD — title`
- **Changed:** template-owned files added, removed, or changed.
- **Migration:** steps for project-owned files (`PROJECT.md`, `README.md`, `.env.example`). Write each as a condition plus an action ("if X, do Y") so it can be skipped when the project already satisfies it. Omit if none.

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
