# Visual verification

For `frontend/` or `app/views/` changes, look at it running — `vp check` doesn't catch layout, styling or runtime errors.

- Prefer the `chrome-devtools` MCP (its screenshots show up in the conversation). Navigate, screenshot, check console and network for new errors.
- Port `8000`/`$PORT` in use by this project → reuse it, don't restart (ask if unsure). In use by another project → don't kill it; run `PORT=<alt> pnpm run dev`.
- Stop only a dev server you started.

## Phone / LAN device, WSL

- Page loads but assets/HMR point at `localhost` instead of the LAN IP → `@vulkano/core` caches the Vite dev manifest once at Express boot. Fix: `touch app.js` to restart the backend (nodemon only watches `app/`, `app.js`, `.env`).
- WSL: `VITE_HOST` must be the Windows host's LAN IP (`ipconfig` on Windows), not the WSL internal IP.
