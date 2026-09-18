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
