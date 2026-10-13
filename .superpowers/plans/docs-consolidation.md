# Docs consolidation — skills vs references

Goal: remove duplication between `.claude/skills/vulkano-skills/` and `references/AGENTS/`.
Rule: skills = worked code/how-to, auto-activated by sharp descriptions. References = short rules (1-3 lines/topic) + skill name. No text in both.

Status: **all tasks done (T1-T7) — pending user review + commits**

## Target references (22 → 6)

| File            | Contains                                                                                                              | Absorbs                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ARCHITECTURE.md | what is what, where it lives (front + backend/api)                                                                    | ARCHITECTURE, ENTRYPOINTS rationale, ASSETS `public/` layout                                                               |
| BACKEND.md      | controllers, scaffold, models, autoload, libraries/services, routes + catch-all, config, security, SEO wiring rules   | BACKEND, CONFIG, ROUTING (backend half), SEO/LAUNCH framework bits (`res.locals.seo`, `SEO_NOINDEX`, robots/sitemap)       |
| FRONTEND.md     | organization, components, store, forms, routes, `$api`, CSS, UI kit, microinteractions, assets, analytics wiring rule | FRONTEND, CSS, UI, MICROINTERACTIONS, STORE, ROUTING (front half), ASSETS, ANALYTICS framework bit (vue-gtag/`VITE_GA_ID`) |
| BUILD.md        | wire entrypoint, Vite config, manifest, `vite()` injection                                                            | ENTRYPOINTS (wiring), VITE                                                                                                 |
| DEVTOOLS.md     | visual verification + LAN/WSL                                                                                         | DEVTOOLS, DEVTOOLS-LAN                                                                                                     |
| WORKFLOW.md     | git/changelog + superpowers plans                                                                                     | GIT, PLANS                                                                                                                 |

Deleted outright: SEO, ANALYTICS, ACCESSIBILITY, TESTING, AREAS, LAUNCH.

## Tasks

- [x] **T1** — Write ARCHITECTURE.md, BACKEND.md, FRONTEND.md (rules only, point to skills).
- [x] **T2** — Write BUILD.md, DEVTOOLS.md, WORKFLOW.md.
- [x] **T3** — Delete the 16 superseded refs. Fix links: README.md, public/robots.txt, test/helpers/bootstrap.js, frontend/website/scss/_grid.scss, `.github/` if any.
- [x] **T4** — PROJECT.md: drop SEO/Analytics/A11y table (keep name/purpose, frontend overrides, deployment).
- [x] **T5** — Skills submodule (own repo): delete vulkano-seo, vulkano-frontend-analytics, vulkano-frontend-a11y. Strip area/SEO/a11y/analytics text from entrypoint, form, views*, controller skills. Remove from every skill text duplicated by a ref rule. Sharpen descriptions. Fix `Reference` sections. Update template-update skill (no PROJECT.md table). Update README(.es).
- [x] **T6** — AGENTS.md: dispatch → 3 refs + skills; drop "Per-area requirements" and "Launch" sections; update `@PROJECT.md` blurb. Minimum rules block stays.
- [x] **T7** — references/CHANGELOG.md entry with Migration steps. `vp check`. Grep for dead links to deleted files.

Commits: ask before each. Submodule commit separate (vulkano-skills repo), then bump pointer in main repo.
