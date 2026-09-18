# UI components

Task needs a pre-built UI component (dialog, dropdown, table, etc.) — pick and install the library at the project level (see `PROJECT.md` § Frontend conventions); the library itself (shadcn-vue, Element Plus, PrimeVue, or any other) is a project decision, not a framework one. Whatever library is chosen, these rules always apply:

- **`components/ui/`**: any vendored/installed UI library component lives under `frontend/<entrypoint>/components/ui/` — isolated from the project's own hand-built components.
- **Component split**: every component under `ui/` follows the same `.vue`/`.js`/`.scss` separation as any other component (`.claude/skills/vulkano-skills/vulkano-frontend-component/SKILL.md`) — template, logic, and styles as their own files, no exceptions for vendored code. A CLI that scaffolds a single file with an inline `<script setup>` block gets manually split before committing.
- **`views/ui/`**: a reference/styleguide view that renders each installed `ui/` component with its variants — this is where new usages get previewed and copied from. Never overwrite a component in `ui/` to fit one specific screen's needs; extend or compose it, and let `views/ui/` be the living source of truth for what's available.
