# PROJECT.md

Project-specific source of truth. Never touched by a template update (pulling a newer `AGENTS.md` from the Vulkano template) — the only place project name, purpose, and project-level decisions belong. `AGENTS.md` includes this file via `@PROJECT.md`.

## What this project is

This is the **Vulkano Framework** — the full-stack app template built on top of `@vulkano/core`. It is the starting point for new Vulkano-based applications.

<!-- On project init: replace the paragraph above with this project's actual name and one-line purpose. -->

## Frontend conventions (optional overrides)

Blank means: no override, the skill's/reference doc's default applies — don't ask again, just use the default.

- **UI library**: (none set — pick and document here when the project installs shadcn-vue/Element Plus/other, see `references/AGENTS/FRONTEND.md` § UI library)
- **Layout system**: (none set — defaults to CSS Grid, no Flexbox, Foundation-style responsive grid, see `references/AGENTS/FRONTEND.md` § CSS)

## Deployment

**CI/CD pipeline: TBD.** No automated pipeline (GitHub Actions or otherwise) exists yet — deploys today are manual.

| Environment | Mechanism |
| ----------- | --------- |
| staging     | TBD       |
| production  | TBD       |

<!-- On project init: replace each TBD with the mechanism this project uses for that environment (PM2, Docker, or Coolify + build pack) — options in README.md § Deployment. List only the selected ones. -->
