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

## Deployment

The project ships with an `ecosystem.config.js` for PM2:

```bash
pm2 start ecosystem.config.js
```

---

## Support

- [Open an issue](https://github.com/vulkanojs/vulkano-core/issues)
- [Open Collective — Backers](https://opencollective.com/vulkanojs#backers)
- [Buy me a coffee](https://buymeacoffee.com/argordmel)

---

## License

MIT © [Vulkano Team](https://github.com/vulkanojs)
