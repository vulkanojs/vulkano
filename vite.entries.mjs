// Single source of truth for frontend entrypoints — shared by vite.config.mjs
// (dev server needs all of them at once) and scripts/build-entries.mjs (which
// builds each one in its own isolated Rolldown pass, see that file for why).
export const entries = {
  app: 'frontend/website/app.js',
  admin: 'frontend/admin/app.js'
};
