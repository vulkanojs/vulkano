// Single source of truth for frontend entrypoints — read by vite.config.mjs:
// the dev server serves all of them at once, and `vp build` builds each one in
// its own isolated Rolldown pass (builder.buildApp in vite.config.mjs).
export const entries = {
  website: 'frontend/website/app.js',
  admin: 'frontend/admin/app.js'
};
