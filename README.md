<p align="center">
  <img src="https://avatars.githubusercontent.com/u/42077334?s=200&v=4" alt="Vulkano Logo" width="100">
</p>

<h1 align="center">Vulkano Framework</h1>

<p align="center">
  Full-stack MVC framework — Express backend + Vue 3 frontend, wired together with Vite.
</p>

<p align="center">
  <a href="https://opencollective.com/vulkanojs#backer"><img src="https://opencollective.com/vulkanojs/backers/badge.svg" alt="Backers"></a>
  <a href="https://opencollective.com/vulkanojs#sponsor"><img src="https://opencollective.com/vulkanojs/sponsors/badge.svg" alt="Sponsors"></a>
  <a href="https://scrutinizer-ci.com/g/vulkanojs/vulkano/?branch=master"><img src="https://scrutinizer-ci.com/g/vulkanojs/vulkano/badges/quality-score.png?b=master" alt="Scrutinizer Code Quality"></a>
</p>

---

## What is Vulkano?

Vulkano is a full-stack framework that gives you a convention-based Express API backend ([`@vulkano/core`](https://github.com/vulkanojs/vulkano-core)) and a Vue 3 frontend — both running from the same project, bundled by Vite.

Inspired by [KumbiaPHP](https://www.kumbiaphp.com).

---

## Project structure

- `app/` is the Express backend
- `frontend/website/` is the public Vue 3 SPA
- `frontend/cms/` is the admin one with Vue 3 SPA and separate entry point (optional, remove if you don't need it)

See docs/ARCHITECTURE.md § Multiple entry points.

Full folder layout: see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Detailed conventions (routing, controller/model, auth, components, testing, SEO, ...) live as Claude Code skills under **`.claude/skills/`** — `docs/BACKEND.md` and `docs/FRONTEND.md` are thin pointers into them.

---

## Stack

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Backend   | Node.js 22, Express 4, Mongoose, @vulkano/core |
| Frontend  | Vue 3, Vue Router, Vite                        |
| Styling   | SCSS, Foundation Sites                         |
| Dev tools | Nodemon, ESLint, PM2                           |

---

## Requirements

- **Node.js** `^22`
- **Vite+ CLI** (`vp`) — installs Vite, Vitest, and the rest of the toolchain globally. See [viteplus.dev](https://viteplus.dev/guide/) for the install command, then verify with `vp help`.
- **MongoDB** (optional — only needed if you use models)
- **Redis** (optional — Socket.io adapter or sessions)

---

## Installation

```bash
pnpm install       # or npm install
```

**New project?** Strip the demo boilerplate (example controller/model, `HelloWorld` component, demo view) before you start building:

```bash
pnpm run cleanup
```

Asks for confirmation (`yes`) before deleting anything. Skip this if you want to keep the demo as a reference.

---

## Dev workflow

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm run dev`     | Start Express + Vite dev server with HMR |
| `pnpm run cleanup` | Remove demo boilerplate (new projects)   |
| `pnpm run build`   | Build frontend assets into `public/`     |
| `pnpm run start`   | Start Express in production mode         |
| `pnpm run lint`    | Lint via `vp lint`                       |
| `pnpm run test`    | Run tests via `vp test`                  |

`pnpm run dev` starts Express and the Vite dev server together, but **only one port matters**: open `http://localhost:$PORT` (`8000` by default, set in `.env`). Express serves the page and injects the Vite-bundled frontend automatically — no need to also open `localhost:5173` in a second tab, that's Vite's internal dev server, not a second app.

---

## Environment variables

```
PORT=8000
HOST=localhost
MONGO_URI=mongodb://localhost:27017/myapp
SALT_KEY=random-string
JWT_SECRET_KEY=supersecret
# COOKIES_SECRET_KEY=another-secret   # optional, only for signed cookies
VITE_CHUNK_NAMES=false
# VITE_HOST=192.168.x.x   # optional — forces a specific dev-server host; unset uses auto LAN detection
```

---

## Working with your AI agent

Be specific about the layer, the data, and the behavior you want.

Instead of: _"add a contact form"_
Say: _"add a contact form with name, email, and message fields, a
`ContactController` that validates them and saves a `Contact` model, and a success message on the frontend"_

Instead of: _"add authentication"_
Say: _"add JWT login using the existing `@vulkano/core` auth conventions, with a `User` model and a login view under `frontend/website/views/Login`"_

Instead of: _"show a list of users"_
Say: _"add a `/users` route backed by `UserController#index` that returns paginated `User` documents, and a `frontend/website/views/Users/Index.vue` that renders them in a table"_

Claude Code picks up the controller/model/view/auth/testing conventions
automatically from `.claude/skills/` — no need to paste them into your
prompt. See [AGENTS.md](AGENTS.md) for the rules your agent reads
automatically (Claude Code, and any tool that honors
`AGENTS.md`/`CLAUDE.md`) — workflow, security boundaries, and handoff
checklist.

### Common tasks

#### Add a new table/collection

1. Tell your AI agent: _"add a `[table]` model with fields `[...]`"_
2. The agent will create/update `app/models/[table].js`

#### Save data through the API

1. Tell your AI agent: _"add a route to save `[table]` to the database"_ — usually `domain.com/api/[table]`
2. The agent creates the matching controller under `app/controllers/api/` and wires it to the model

#### Show records — frontend view or backend view

Say which one you want, they're not the same:

- **Frontend view** (Vue SPA, client-rendered): _"create a view to show `[table]` records"_ → `frontend/website/views/[Table]/Index.vue`, fetches data via `frontend/website/Api.js`
- **Backend view** (Nunjucks, server-rendered): _"create a backend view to show `[table]` records"_ → `app/views/[table]/index.html`, rendered by the controller via `res.vsr`/`res.render`

#### Add a form

1. Tell your AI agent: _"create a route to create a form"_ (e.g. _"add a `/posts/new` route with a form to create a `Post`"_)
2. The agent adds the route in `frontend/website/routes.js` and a view under `frontend/website/views/`, wired to the API route that saves the model

| Task          | What to tell your agent                                                  |
| ------------- | ------------------------------------------------------------------------ |
| New component | _"add a `PostCard` component"_ → `frontend/website/components/PostCard/` |
| Run checks    | `vp check` (format/lint/typecheck) and `vp test` (tests)                 |

### The `inbox/` folder

Drop any files here that you want your AI agent to work with — logos,
images, fonts, PDFs — then tell your agent to use them, e.g. _"use the
logo in inbox/ for the header"_. Files dropped in `inbox/` are not
committed by default (see `inbox/.gitignore`).

For images, run the following to convert `.jpg`/`.jpeg`/`.png` files in
`inbox/` to `.webp` in place (smaller file size, originals are kept):

```bash
pnpm run inbox:webp
```

Then use `<picture>` with the `.webp` as the primary source and the
original as fallback, plus explicit `width`/`height` (prevents layout
shift) and `loading="lazy"` for below-the-fold images:

```html
<picture>
  <source srcset="/img/hero.webp" type="image/webp" />
  <img src="/img/hero.jpg" alt="..." width="1200" height="600" loading="lazy" />
</picture>
```

---

## Deployment

### PM2 (SSH)

The project ships with an `ecosystem.config.js` for PM2:

```bash
pm2 start ecosystem.config.js
```

### Docker

Build and run the production image directly:

```bash
docker build -t vulkano-framework .
docker run --env-file .env -p 8000:8000 vulkano-framework
```

Or use Docker Compose, which reads `.env` for you:

```bash
docker compose up --build
```

By default this only starts the `app` service — set `MONGO_URI` in `.env` to
point at an external MongoDB (Atlas, a managed instance, etc). If you'd
rather run MongoDB locally in a container, start the `local-db` profile
instead:

```bash
docker compose --profile local-db up --build
```

### Coolify

Use the **Docker Compose** deployment type in Coolify and point it at this
repo — it picks up `docker-compose.yml` and `nixpacks.toml` automatically.

`.env` is gitignored and never reaches the build, so set your environment
variables (`PORT`, `MONGO_URI`, `SALT_KEY`, `JWT_SECRET_KEY`, etc) in Coolify's
own **Environment Variables** panel for the app — Coolify injects them into
the running container at deploy time.

---

## Support

- [Open an issue](https://github.com/vulkanojs/vulkano-core/issues)
- [Open Collective — Backers](https://opencollective.com/vulkanojs#backers)
- [Buy me a coffee](https://buymeacoffee.com/argordmel)

---

## License

MIT © [Vulkano Team](https://github.com/vulkanojs)
