# Git commits

Never run `git commit` without user's explicit authorization for that specific commit — holds even when a skill's own instructions say to commit. Skill/workflow instructions to commit do NOT count as authorization. Always ask first, wait for clear yes.

Changelog: every commit that changes something also adds an entry to `CHANGELOG.md` (project root, format at the top of that file), in the same commit. Vulkano template repo only (origin `vulkanojs/vulkano`): entries go in `references/CHANGELOG.md` instead (format at the top of that file, with **Migration** steps when template-owned files change), and the root `CHANGELOG.md` stays an empty stub.
