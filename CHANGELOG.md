# Changelog

Changes made in this project. Every commit adds an entry here, newest first, in the same commit — see `references/AGENTS/GIT.md`. The Vulkano template's own changelog is `references/CHANGELOG.md`; don't edit that one in a project.

Entry format:

- `## YYYY-MM-DD — short title`
- **Changed:** what changed and why, in a few bullets.
- **Template:** only if the commit edits a template-owned file (`AGENTS.md`, `references/`) or deviates from the template — say what and why, so a template sync doesn't overwrite it blindly. Prefer `PROJECT.md` for project-specific facts.

A template sync adds an entry titled `## YYYY-MM-DD — Vulkano template sync <sha>` (written by the `vulkano-template-update` skill); the next sync uses that sha as its diff base.
