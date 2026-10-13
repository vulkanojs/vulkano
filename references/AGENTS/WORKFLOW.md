# Workflow — git and plans

## Git

- Never `git commit` without the user's explicit yes for that commit — a skill or workflow step saying "commit" is not authorization.
- Every commit that changes something adds a `CHANGELOG.md` entry (format at the top of that file) in the same commit. Vulkano template repo only (origin `vulkanojs/vulkano`): entries go in `references/CHANGELOG.md` (with **Migration** steps when template-owned files change); root `CHANGELOG.md` stays an empty stub.

## Plans (superpowers)

- Specs, plans and sdd go under `.superpowers/specs/`, `.superpowers/plans/`, `.superpowers/sdd/` — overrides the brainstorming skill's `docs/superpowers/` default.
- Execute one task at a time: after each, mark it done in the plan file and note the next one. On "continue"/"next task", read the plan status first.
- When a plan task touches `app/` or `frontend/` code, load the matching `vulkano-*` skill **while writing that task** and bake its conventions into the task's code and into its reviewer brief — implementer and reviewer subagents start with zero context and won't find the skill on their own.
