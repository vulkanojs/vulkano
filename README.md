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

---

## Project structure

```
vulkano/
├── app.js                  # Server entry point
├── vite.config.mjs         # Vite config (builds client/ and cms/)
│
├── app/                    # Backend (Express / @vulkano/core)
│   ├── config/
│   │   ├── settings.js     # Port, DB connection, JWT, CORS…
│   │   ├── routes.js       # Explicit route mappings (optional)
│   │   ├── env/            # Per-environment config overrides
│   │   ├── express/        # Cookie, session, CORS, helmet…
│   │   └── locales/        # i18n translation files
│   ├── controllers/        # Request handlers
│   ├── models/             # Mongoose model definitions
│   ├── services/           # Shared libs (auto-loaded as globals)
│   └── views/              # Nunjucks templates
│
├── client/                 # Vue 3 frontend (main app)
│   ├── app.js              # Vue entry point
│   ├── App.vue
│   ├── routes.js           # Vue Router routes
│   ├── Api.js              # Axios wrapper for the backend API
│   ├── components/
│   ├── layouts/
│   └── views/
│
├── cms/                    # Vue 3 CMS frontend (separate bundle)
│   └── cms.js
│
└── public/                 # Static output (built assets + uploaded files)
    ├── css/
    ├── js/
    ├── img/
    └── files/
```

---

## Backend — Controllers

Controllers live in `app/controllers/`. Vulkano maps routes **by convention** — no config needed for standard CRUD.

### Naming convention

| HTTP method | URL             | Controller method           |
|-------------|-----------------|-----------------------------|
| `GET`       | `/product`      | `ProductController.get`     |
| `POST`      | `/product`      | `ProductController.post`    |
| `PUT`       | `/product/42`   | `ProductController['put :id']` |
| `PATCH`     | `/product/42`   | `ProductController['patch :id']` |
| `DELETE`    | `/product/42`   | `ProductController['delete :id']` |
| `GET`       | `/product/42`   | `ProductController['get :id']` |
| `POST`      | `/product/save` | `ProductController['post save']` |

### Example controller

```js
// app/controllers/ProductController.js
module.exports = {

  // GET /product
  get(req, res) {
    res.vsr(Product.getAll(req.query));
  },

  // GET /product/:id
  'get :id': function (req, res) {
    res.vsr(Product.getProduct(req.params.id));
  },

  // POST /product
  post(req, res) {
    res.vsr(Product.create(req.body), 201);
  },

  // PUT /product/:id
  'put :id': function (req, res) {
    res.vsr(Product.update(req.params.id, req.body), 202);
  },

  // DELETE /product/:id
  'delete :id': function (req, res) {
    res.vsr(Product.delete(req.params.id), 204);
  }

};
```

All responses go through `res.vsr(promise, statusCode?)`, which wraps the result in:

```json
{ "success": true, "statusCode": 200, "data": { … } }
```

### Scaffold controller (zero-code REST API)

If your controller just maps to a model, use `scaffold` and skip writing all the methods:

```js
// app/controllers/api/ProductController.js
module.exports = {
  scaffold: 'Product',
  allowedMethods: ['get', 'post', 'put', 'patch', 'delete']
};
```

This auto-generates all 6 REST endpoints. See [`@vulkano/core`](https://github.com/vulkanojs/vulkano-core) for details.

---

## Backend — Routes

By default Vulkano resolves routes automatically from controller names. You only need `app/config/routes.js` for:

- Mapping a URL to a specific controller/action
- Serving the Vue frontend on wildcard paths
- Inline or advanced route handlers

```js
// app/config/routes.js
module.exports = {

  // Map root to HomeController.get
  '/': 'HomeController.get',

  // Serve the CMS Vue app on all /admin/* paths
  '/admin*': 'HomeController.cms',

  // Inline handler
  // '/ping': (req, res) => res.json({ ok: true }),

  // Advanced: register routes directly on Express
  // custom() {
  //   app.get('/custom', (req, res) => res.json({ hello: 'world' }));
  // },

};
```

---

## Backend — Models

Models live in `app/models/` and are **auto-loaded as globals** (e.g., a file named `Product.js` becomes the global `Product`).

```js
// app/models/Product.js
module.exports = {

  attributes: {
    name:  { type: String, required: true },
    price: { type: Number, default: 0 },
    tags:  [String],
  },

  // Text search index
  indexes: [{ name: 'text' }],

  // Get paginated list
  getAll(props) {
    const query = Paginate.serializeQuery({
      sort: 'createdAt|DESC',
      searchBy: ['name'],
      filter: { active: true }
    }, props);
    return Paginate.get(Product, query);
  },

  // Get one by ID (validates ObjectID format)
  getProduct(_id) {
    if (!(/^[a-fA-F0-9]{24}$/).test(_id)) {
      return VSError.reject('Invalid ID', 404);
    }
    return Product.findOne({ _id }).then((r) => {
      if (!r) return VSError.notFound('Product');
      return r.toObject({ transform: true });
    });
  },

  // Create
  create(data) {
    return new Product(data).save();
  },

  // Update
  update(_id, data) {
    return Product.getProduct(_id).then((record) =>
      Product.findOneAndUpdate({ _id }, { ...record, ...data }, { new: true })
    );
  },

  // Soft-delete
  delete(id) {
    return this.update(id, { active: false });
  },

  // Lifecycle hooks
  beforeSave(cb) {
    cb();
  }

};
```

Every model automatically gets three extra fields: `active` (Boolean, default `true`), `createdAt` (Date), and `updatedAt` (Date).

---

## Frontend — Vue 3 + Vite

The `client/` folder is a standard Vue 3 SPA wired to the Express backend via `Api.js`.

### Entry point — `client/app.js`

```js
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';
import createRouter from '@client/routes';
import App from '@client/App.vue';
import Api from '@client/Api';

const app = createApp(App);
app.config.globalProperties.$api = Api;
app.use(createRouter(createWebHistory())).mount('#app');
```

### Adding a route — `client/routes.js`

```js
import Layout from '@client/layouts/Layout.vue';
import Homepage from '@client/views/Home/Home.vue';
import ProductPage from '@client/views/Product/Product.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '',         component: Homepage },
      { path: 'products', component: ProductPage },
    ],
  }
];

export default (history) => createRouter({ history, routes });
```

### Calling the API from a component

`$api` is available globally in every component:

```vue
<script>
export default {
  async created() {
    this.products = await this.$api.get('/product');
  }
}
</script>
```

`Api.js` calls `/api/*` on the same Express server, unwraps the `data` field from the VSR envelope, and handles errors via an Axios interceptor.

---

## Vite

Vite handles the frontend build and dev server. The config in `vite.config.mjs`:

- **Two entry points**: `client/app.js` (main app) and `cms/cms.js` (admin panel)
- **Output**: assets land in `public/js/`, `public/css/`, `public/img/` — served directly by Express
- **Dev server**: runs alongside Express with HMR; CORS is open so both servers communicate freely
- **SCSS**: pre-configured load paths for Foundation Sites, Element Plus, `@mdi/font`, and AOS
- **Aliases**: `@client` → `client/`, `@cms` → `cms/`
- **Cache hashing**: controlled by the `VITE_CHUNK_NAMES=true` env var (off by default for simpler filenames)

### Build output

```
public/
├── js/
│   ├── app.js      # Vue main app bundle
│   └── cms.js      # CMS bundle
├── css/
│   └── app.css
└── .vite/
    └── manifest.development.json   # Used by Nunjucks to inject asset URLs
```

The Nunjucks templates read the manifest to inject the correct `<script>` and `<link>` tags in dev and production.

---

## Configuration — `app/config/settings.js`

```js
module.exports = {
  port: process.env.PORT || 8000,
  database: {
    connection: process.env.MONGO_URI || null,
  },
  salt: process.env.SALT_KEY || '',
};
```

Use `.env` for secrets:

```
PORT=8000
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=supersecret
SALT_KEY=random-string
```

---

## Deployment

The project ships with a `Procfile` for Heroku and an `ecosystem.config.js` for PM2:

```bash
# PM2
pm2 start ecosystem.config.js

# Heroku / Render / Railway
git push heroku main
```

---

## Support

- [Open an issue](https://github.com/vulkanojs/vulkano-core/issues)
- [Open Collective — Backers](https://opencollective.com/vulkanojs#backers)
- [Buy me a coffee](https://buymeacoffee.com/argordmel)

---

## License

MIT © [Vulkano Team](https://github.com/vulkanojs)
