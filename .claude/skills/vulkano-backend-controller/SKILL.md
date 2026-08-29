---
name: vulkano-backend-controller
description: Use when creating, editing, or wiring a route to load a view, API endpoint, or socket event in this Vulkano framework project — controller file placement, HTTP-verb-to-method-key convention, res.vsr/res.render usage, scaffold controllers, and socket event handlers.
---

# Backend Controller

## Overview

Vulkano resolves routes by convention: URL segments map to `/:resource/:method?/:param?` → `<Resource>Controller.<method>`. This skill covers where a controller goes, how its method keys map to HTTP verbs/paths, and the three request kinds: view, API, socket.

## When to use

- New page/view needs a backend controller to render it (`res.render`)
- New API endpoint (list/get/create/update/delete or a custom action)
- New or edited socket event handler
- Editing an existing controller's method or route

Not for pure `client/` frontend work — see FRONTEND.md instead.

## Before implementing

- Check if a similar controller already exists (`app/controllers/`, `app/controllers/api/`, `app/controllers/sockets/`) — extend/mirror it instead of inventing a new shape.
- Check `app/config/routes.js` for an explicit override before assuming convention-based routing applies.
- Check the target model has (or needs) the CRUD methods the controller will call — `getAll`, `get<Model>`, `create`, `update`, `delete` (see vulkano-backend-model skill; requires `MONGO_URI` configured).

## File placement & naming

| Kind              | Path                                          | Example                 |
| ----------------- | --------------------------------------------- | ----------------------- |
| View controller   | `app/controllers/<Name>Controller.js`         | `HomeController.js`     |
| API controller    | `app/controllers/api/<Name>Controller.js`     | `ProductsController.js` |
| Socket controller | `app/controllers/sockets/<Name>Controller.js` | `EchoController.js`     |

Controller name: plural PascalCase + `Controller` suffix. Resource segment in the URL = controller's own filename, lowercased.

## Method key → route

Key format: `'<verb>? <path tail>'`. No space in the key = `GET`. A non-GET custom action needs the verb spelled out.

```js
module.exports = {
  get(req, res) {
    // GET /resource?populate=...
    res.vsr(Product.getAll(req.query || {})); // forward req.query — page/sort/search/populate all flow through
  },
  'get :id': (req, res) => {
    // GET /resource/:id
    res.vsr(Product.getProduct(req.params.id, req.query));
  },
  post(req, res) {
    // POST /resource
    res.vsr(Product.create(req.body), 201);
  },
  'put :id': (req, res) => {
    // PUT /resource/:id
    res.vsr(Product.update(req.params.id, req.body), 202);
  },
  'post save': (req, res) => {}, // POST /resource/save
  'delete :id': (req, res) => {
    // DELETE /resource/:id
    res.vsr(Product.delete(req.params.id), 204);
  }
};
```

`res.vsr`'s 2nd arg is the success status code (default 200) — use `201` create, `202` update, `204` delete, matching `node_modules/@vulkano/core/examples/controllers/RestExampleController.js`. `Product.getAll(...)`'s resolved value (the `data` field of the envelope) is normally a page object (`{ items, page, perPage, totalPages, ... }`) — the consumer reads `data.items`. But if the request sent `?page=all`, it's a **bare array** instead (no `.items`, no page metadata) — see vulkano-backend-model § `getAll(props)` resolves to one of TWO different shapes. Don't hardcode one shape without checking whether this endpoint allows `page=all`.

Only add an entry to `app/config/routes.js` when the convention can't express it (absolute path, SPA catch-all, or the route breaks the "resource = controller filename" rule). A redundant explicit entry gives the route two sources of truth.

## Create + edit → one method/route, not two

Same rule on both sides of a form: don't split create and edit into separate methods/controllers just because one has an `:id` and the other doesn't.

- **API controller**: already the natural shape — `post` (create) and `'put :id'` (update) are two method keys on the _same_ controller calling the _same_ model, shown above. Don't add a separate `CreateController`/`EditController`.
- **View controller** serving a form page (`/product/create`, `/product/edit/:id`) — one method renders the same template for both, branching only on whether `:id` is present to prefill data:

```js
// app/controllers/ProductsController.js
module.exports = {
  'get create': (req, res) => res.render('product/form.html', { product: null }),
  'get edit :id': (req, res) => {
    Product.getProduct(req.params.id).then((product) =>
      res.render('product/form.html', { product })
    );
  }
};
```

Matches the frontend's single `Form.vue` (branches on route `:id` the same way — see vulkano-frontend-router § Create + Edit) — one template/form markup reused for both actions instead of duplicating it.

## View vs API response

- View controller → `res.render('folder/file.html', { ...locals })`. Writing the actual template? See vulkano-backend-views (routes to the Nunjucks or Handlebars skill depending on `app/config/views.js`).
- API controller → `res.vsr(promise, statusCode?)` → resolves to `{ success, statusCode, data }`. Errors: `VSError.reject(msg, code)`, `VSError.notFound(name)`, or a plain rejection → 500.

## Controller rules (this project)

- No top-level functions/consts outside `module.exports` — only `require`/import statements plus the exported object and its methods. Extract helper logic to `app/services/<Name>.js` (auto-loaded global) or, for business rules, the model.
- Keep it thin: read params → call model/service → respond. Business logic and validation live on the model, not the controller.
- Full CRUD API shortcut — scaffold:

```js
// app/controllers/api/ProductsController.js
module.exports = {
  scaffold: 'Product',
  allowedMethods: ['get', 'post', 'put', 'patch', 'delete']
};
```

The `Order` model above needs no code at all for this — `getAll(props)`, `get<ModelName>(id, props)`, `create(data)`, `update(id, data)`, `delete(id)`, and `_buildPopulate` are all mixed into every model automatically by the core's scaffold layer (`database/scaffold.js`), including `?populate=` support. A model only needs to hand-write these if it's NOT using the scaffold shortcut, or wants to override one of them — see vulkano-backend-model.

## Sockets

1. Register the event in `app/config/sockets/events.js`:

```js
module.exports = {
  eventName: 'sockets.NameController.method'
};
```

2. Implement it in `app/controllers/sockets/NameController.js`:

```js
module.exports = {
  method({ socket, body }, callback) {
    callback({/* result */});
  }
};
```

Handler signature is always `({ socket, body }, callback)`. Requires `app/config/sockets/config.js` with `enabled: true` (adapter defaults to in-memory; redis/mongodb available). Optional `app/config/sockets/cors.js` and `app/config/sockets/middlewares/auth.js` for origin/auth checks.

## After writing

- New/changed controller → add a test under `test/app/controllers/*.http.test.js` (see TESTING.md). API controllers assert the `res.vsr` envelope (`{ success, statusCode, data }`); view controllers assert the rendered HTML body.
- Run `vp check` and `vp test`.
- Never `require()` a model or service — both are auto-loaded globals, reference by name (`Product`, `Upload`, ...).
- New public/crawlable view → apply SEO essentials (SEO.md) unless that area's SEO column is off (see AGENTS.md § Project requirements).

## Handoff

Report: which file(s) were created/changed, which convention applied (view/API/socket, scaffold vs custom), any route/socket-event implications, and `vp check`/`vp test` results.

## Reference

Full detail: `node_modules/@vulkano/core/README.md` (§ Routing, § Scaffold, § Socket.io, § Models) and `docs/BACKEND.md`. Worked examples: `node_modules/@vulkano/core/examples/controllers/` (`ExampleController.js`, `RestExampleController.js`, `RestScaffoldController.js`). Related skills: vulkano-backend-model (CRUD signatures, `_buildPopulate`, `active`/soft-delete — required for anything a controller calls on a model), vulkano-backend-views (res.render → HTML template skill routing).
