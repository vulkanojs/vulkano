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
</p>

---

## What is Vulkano?

Vulkano is a full-stack framework that gives you a convention-based Express API backend ([`@vulkano/core`](https://github.com/vulkanojs/vulkano-core)) and a Vue 3 frontend — both running from the same project, bundled by Vite.

Inspired by [KumbiaPHP](https://www.kumbiaphp.com).

For the project structure, routing conventions, and controller/model/response conventions, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Backend   | Node.js 22, Express 4, Mongoose, @vulkano/core |
| Frontend  | Vue 3, Vue Router, Vite                      |
| Styling   | SCSS, Foundation Sites                       |
| Dev tools | Nodemon, ESLint, PM2                         |

---

## Requirements

- **Node.js** `^22`
- **MongoDB** (optional — only needed if you use models)
- **Redis** (optional — Socket.io adapter or sessions)

---

## Installation

```bash
pnpm install       # or npm install
```

---

## Dev workflow

| Command          | Description                               |
|------------------|-------------------------------------------|
| `pnpm run dev`    | Start Express + Vite dev server with HMR  |
| `pnpm run build`  | Build frontend assets into `public/`      |
| `pnpm run start`  | Start Express in production mode          |
| `pnpm run lint`   | Lint via `vp lint`                        |
| `pnpm run test`   | Run tests via `vp test`                   |

---

## Environment variables

```
PORT=8000
HOST=localhost
MONGO_URI=mongodb://localhost:27017/myapp
SALT_KEY=random-string
JWT_SECRET=supersecret
VITE_HOST=localhost
VITE_CHUNK_NAMES=false
```

---

## Working with your AI agent

Be specific about the layer, the data, and the behavior you want.

Instead of: *"add a contact form"*
Say: *"add a contact form with name, email, and message fields, a
`ContactController` that validates them and saves a `Contact` model, and a success message on the frontend"*

Instead of: *"add authentication"*
Say: *"add JWT login using the existing `@vulkano/core` auth conventions, with a `User` model and a login view under `client/views/Login`"*

Instead of: *"show a list of users"*
Say: *"add a `/users` route backed by `UserController#index` that returns paginated `User` documents, and a `client/views/Users/Index.vue` that renders them in a table"*

See [ARCHITECTURE.md](ARCHITECTURE.md) for the controller/model/view
conventions your agent should follow.

### The `inbox/` folder

Drop any files here that you want your AI agent to work with — logos,
images, fonts, PDFs — then tell your agent to use them, e.g. *"use the
logo in inbox/ for the header"*. Files dropped in `inbox/` are not
committed by default (see `inbox/.gitignore`).

For images, run the following to convert `.jpg`/`.jpeg`/`.png` files in
`inbox/` to `.webp` in place (smaller file size, originals are kept):

```bash
pnpm run inbox:webp
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
variables (`PORT`, `MONGO_URI`, `SALT_KEY`, `JWT_SECRET`, etc) in Coolify's
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
