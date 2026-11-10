# Workflow — git and plans

## Git

- Never `git commit` without the user's explicit yes for that commit — a skill or workflow step saying "commit" is not authorization.
- Every commit that changes something adds a `CHANGELOG.md` entry (format at the top of that file) in the same commit. Vulkano template repo only (origin `vulkanojs/vulkano`): entries go in `references/CHANGELOG.md` (with **Migration** steps when template-owned files change); root `CHANGELOG.md` stays an empty stub.

## Plans (superpowers)

- Specs, plans and sdd go under `.superpowers/specs/`, `.superpowers/plans/`, `.superpowers/sdd/` — overrides the brainstorming skill's `docs/superpowers/` default.
- Execute one task at a time: after each, mark it done in the plan file and note the next one. On "continue"/"next task", read the plan status first.
- When a plan task touches `app/` or `frontend/` code, name the matching `vulkano-*` skill(s) in the task. When executing with subagents, pass each skill's path (`.claude/skills/vulkano-skills/<skill>/SKILL.md`) in the implementer and reviewer briefs so they read it themselves — the controller does not load it in its own thread unless it writes that code itself.

## Hooks

- `.claude/settings.json` runs `scripts/agent-check.js` after every `Edit`/`Write`: `vp check --fix` on that file. A hook error is a failed check — fix it before moving on, never work around it.

## Review

- Subagent `vulkano-reviewer` (`.claude/agents/`) reviews a change against these rules — what lint, types and tests can't judge (layers, server-side auth, render vs vsr, test quality, disable reasons, changelog). Run it after a multi-file change or each plan task, before handoff. It reports; you fix.
