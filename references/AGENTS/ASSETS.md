# Assets (images, fonts, files)

- Static frontend assets (images, fonts, downloadable files) live directly in `public/` (`public/img/`, `public/fonts/`, `public/files/`) — not under `frontend/`, and not pulled through the Vite bundler via `@frontend`/relative `import`/`src="@frontend/..."`.
- Reference them by absolute path from the app root: `/img/<name>.webp`, `/fonts/<name>.woff2`, `/files/<name>`. Same in CSS `url(...)`.
- Namespace per feature when a design drops multiple files at once (e.g. `public/img/<section>/background.webp`) to avoid collisions in the flat `public/img/` root.
- Optimize photographic images to `.webp` first via `scripts/webp.js` — drop the source directly under `public/img/` and run `pnpm run webp`; it converts in place, rewrites any `.vue`/`.scss`/`.css`/`.njk`/`.hbs`/`.html`/`.js` references from the old extension to `.webp`, then asks once whether to delete the now-unused originals.
