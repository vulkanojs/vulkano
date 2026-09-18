# PROJECT.md

Project-specific source of truth. Never touched by a template update (pulling a newer `AGENTS.md` from the Vulkano template) — the only place project name, purpose, and per-area decisions belong. `AGENTS.md` includes this file via `@PROJECT.md`.

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It is the starting point for new Vulkano-based applications.

<!-- On project init: replace the paragraph above with this project's actual name and one-line purpose. -->

## Project requirements — SEO / Analytics / Accessibility

Decision process, category mapping, and doc pointers: `references/AGENTS/AREAS.md`. This table is this project's actual state — treat it as the answer, don't ask again for a listed area:

| Area (path/entry point)                    | SEO | Analytics | Accessibility |
| ------------------------------------------ | --- | --------- | ------------- |
| `/` (`frontend/website/`) — public site    | on  | on        | on            |
| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |

## Frontend conventions (optional overrides)

Blank means: no override, the skill's/reference doc's default applies — don't ask again, just use the default.

- **UI library**: (none set — pick and document here when the project installs shadcn-vue/Element Plus/other, see `references/AGENTS/UI.md`)
- **Layout system**: (none set — defaults to CSS Grid, no Flexbox, Foundation-style responsive grid, see `.claude/skills/vulkano-skills/vulkano-frontend-css/SKILL.md`)

## Deployment

**CI/CD pipeline: TBD.** No automated pipeline (GitHub Actions or otherwise) exists yet — deploys today are manual.

Mechanism used per environment (PM2 / Docker / Coolify) — fill in on project init. What each option is and how it's wired: `references/AGENTS/DEPLOYMENT.md`, read only when deploying.

| Environment | Mechanism |
| ----------- | --------- |
| staging     | TBD       |
| production  | TBD       |
