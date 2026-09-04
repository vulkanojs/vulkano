---
name: vulkano-backend-model
description: Use when creating, editing, or reviewing a Mongoose model in this Vulkano framework project, only if MONGO_URI/a database is configured — schema attributes, standard CRUD methods, hooks, scaffold shortcut, active/soft-delete, autopopulate/_buildPopulate joins, and where business logic belongs.
---

# Backend Model

## Overview

Models live in `app/models/`, auto-loaded as globals (e.g. `Order.js` → `global.Order`). Business logic, validation, and data manipulation belong here — controllers only call model methods, never `Model.find(...)` directly.

## When to use

Requires `MONGO_URI` set (`.env`) — a Mongoose model is meaningless without a configured database. If `MONGO_URI` is missing, don't apply this skill; tell the user a database isn't configured yet instead.

- New resource needs a model (schema + CRUD)
- Adding/editing business logic, validation, or a computed field
- Wiring a list/get endpoint's related-doc data (`autopopulate`/`_buildPopulate`)
- Adding a soft-delete field or a business on/off flag

Not for controllers/routes — see vulkano-backend-controller skill. Not for Vue frontend state — see FRONTEND.md.

## Before implementing

- Confirm `MONGO_URI` exists in `.env` (or `TEST_MONGO_URI` for test context). No DB configured → stop, this skill doesn't apply yet.
- Check if a similar model exists — mirror its `getAll`/hooks shape instead of inventing a new one.
- Decide the filename: singular PascalCase (`Order.js` → `global.Order`, collection `order`, never pluralized).
- Decide scaffold (zero-code CRUD) vs custom CRUD methods.
- Don't introduce a repository/data-access abstraction layer or a parallel persistence pattern — the model IS the persistence layer here (Mongoose + these CRUD methods), per this project's KISS/no-premature-abstraction rule.

## File & naming

`app/models/<Name>.js`, singular PascalCase. A model only maps to a MongoDB collection if it defines `attributes` — without `attributes` it's a plain global, not collection-backed.

## Standard CRUD methods

| Method                       | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `getAll(props)`              | List/paginate. `props` = `{ page, perPage, search, sort, populate }`             |
| `get<ModelName>(id, props?)` | Get one record by id. `props` optional, only needed for `?populate=` (see below) |
| `create(data)`               | Create                                                                           |
| `update(id, data)`           | Update                                                                           |
| `delete(id)`                 | Soft-delete (`return this.update(id, { active: false })`)                        |

```js
// app/models/<Name>.js — shape adapted from node_modules/@vulkano/core/examples/models/Example.js
module.exports = {
  attributes: {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    // ref relation, opted into ?populate= — see Populate below
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', autopopulate: true }
  },
  getAll(props) {
    const defaultProps = { sort: 'createdAt|DESC', searchBy: ['name'], filter: { active: true } };
    const populate = this._buildPopulate(props); // built-in, see Populate below
    const query = Paginate.serializeQuery(defaultProps, props);
    return Paginate.get(Example, query, populate);
  },
  getExample(_id, props) {
    const query = Example.findOne({ _id });
    this._buildPopulate(props).forEach((p) => query.populate(p));
    return query.then((r) => (r ? r.toObject({ transform: true }) : VSError.notFound()));
  },
  create(data) {
    return new Example(data).save();
  },
  update(_id, data) {
    return Example.getExample(_id).then((record) => {
      const merged = { ...record, ...data };
      return Example.findOneAndUpdate({ _id }, merged, { new: true }).then((r) =>
        r.toObject({ transform: true })
      );
    });
  },
  delete(id) {
    return this.update(id, { active: false });
  }
};
```

Zero-code alternative — a scaffold model only needs `attributes` (+ optional `fillable: [...]` to whitelist updatable fields); the CRUD methods above are generated for it when the matching controller declares `scaffold: 'ModelName'` (see vulkano-backend-controller skill).

## `getAll(props)` resolves to one of TWO different shapes — depends on `props.page`

Verified in `node_modules/@vulkano/core/libs/Paginate.js#get` (lines ~216-283):

- `props.page` a number, or omitted (defaults to `1`) → a **page object**: `{ items, page, perPage, totalPages, next, prev, cursor }`. Consumer reads `.items`, never iterates the resolved value itself.
- `props.page === 'all'` (i.e. the caller passed `?page=all`) → pagination is skipped entirely and `getAll` resolves to a **bare array** of Mongoose documents instead — no `.items`, no page metadata, and these documents are NOT run through `.toObject({ transform: true })` (unlike `getExample`/`get<ModelName>`).

Any code consuming `getAll` — a controller doing `res.vsr(Model.getAll(req.query))`, a view template iterating the result, frontend list code — must handle both shapes if `?page=all` is a real possibility for that endpoint (an admin "export all" action, e.g.), or explicitly reject/ignore `page=all` if the endpoint should always paginate. Don't assume `.items` always exists.

## Ad-hoc filters in `getAll` (e.g. `?category=<id>`)

Not part of the populate mechanism — a separate, equally common need: filtering the list by a plain field value passed in the query string. Read it off `props` and merge it into `defaultProps.filter` before calling `Paginate.serializeQuery`:

```js
getAll(props) {
  const defaultProps = { sort: 'createdAt|DESC', searchBy: ['name'], filter: { active: true } };
  if (props.category) {
    defaultProps.filter.category = props.category; // exact-match filter, e.g. ?category=<id>
  }
  const populate = this._buildPopulate(props);
  const query = Paginate.serializeQuery(defaultProps, props);
  return Paginate.get(Example, query, populate);
}
```

Validate/cast the value (e.g. confirm it's a valid ObjectId) before using it in the filter if it comes straight from user input.

## `createdAt`/`updatedAt` — never hand-roll

Auto-injected on every model schema. Don't add a manual timestamp field (`at`, `date`, `timestamp`, ...) — use `createdAt`/`updatedAt` directly in sort strings, indexes, and business logic.

## `active` — soft-delete only

Reserved for the soft-delete convention (`delete(id)` sets `active: false`, hidden from normal queries). For a business-level on/off, paused/live, or available/unavailable state, add a dedicated field named for the domain concept instead (e.g. an `availability: Boolean` field on a Product-like model, default `true`) — never reuse `active` as a generic enabled/disabled toggle, even when a UI toggle looks like it maps 1:1.

## Populate — `autopopulate: true` + built-in `_buildPopulate`

Every model gets `_buildPopulate(props, extra)`, `_parsePopulateEntries(props)`, and `_getSanitizedPopulate(props)` mixed in automatically (`database/scaffold.js`, merged into every model's statics — no per-model wiring needed). Nothing else to require or import.

- **Security gate**: a `ref` attribute is only ever populatable if it declares `autopopulate: true`, or the model explicitly allowlists it per-call via the `extra` arg (`this._buildPopulate(props, ['someRef'])`). A `ref` field without either is never populated, no matter what the caller asks for.
- **Query syntax** — comma-separated relations, optional `|`-separated field allowlist per relation after a colon:
  - `?populate=category` → full related doc
  - `?populate=category:name` → only `{ _id, name }`
  - `?populate=category:name|slug,brand` → `category` limited to name+slug, plus full `brand`
- **Usage in a model method**: call `this._buildPopulate(props)` to get the populate array, then either pass it as `Paginate.get(Model, query, populate)`'s 3rd arg (list endpoints) or `.forEach((p) => query.populate(p))` on a `findOne` query (single-record endpoints).
- Field names are matched case-insensitively against the schema's real paths — the caller doesn't need to know exact casing.
- **Sensitive fields — `select: false` does NOT protect against this**: `_buildPopulate` passes the caller's `field1|field2` list straight into Mongoose's populate `select` as a plain inclusion list. Verified against this project's installed `mongoose` (`queryHelpers.js#applyPaths`): an explicitly-named field in an inclusion select overrides schema-level `select: false` — no `+` needed, so `?populate=user:password` returns `password` if that path exists on `User`, regardless of `select: false`. Don't rely on `select: false` alone here. Instead: never put `autopopulate: true` on a `ref` whose target model has fields the caller shouldn't see, or wrap `this._buildPopulate(props)`'s result and strip any `select` entries that name a sensitive field before passing it to `Paginate.get`/`query.populate`.

## Hooks (optional)

`beforeValidate(cb)`, `afterValidate(cb)` — run only on `create()` (via `.save()`), not on `update()`/`delete()` (Mongoose update validators bypass them). `beforeSave(cb)` (`this` = the document). `afterSave(doc, cb)`. `beforeFindOneAndUpdate(cb)` (`this` = the Query — runs on both `update()` and `delete()` since both call `findOneAndUpdate`). `afterFindOneAndUpdate(doc, cb)`. Always call `cb()` (or `cb(err)` to abort).

## After writing

- Changing an existing model's method signature, `attributes`, or return shape → grep the method/field name across `app/controllers/`, `app/services/`, `app/config/sockets/` and confirm every caller still gets what it expects.
- Add a test under `test/app/models/<Name>.test.js` (see TESTING.md) — assert business rules/validation directly against the model (`.rejects.toThrow(...)` for invalid input).
- Run `vp check` and `vp test`.
- Constants shared across models/services/controllers go in `app/config/common.js` (`app.config.common.X`), not hardcoded per-model.

## Handoff

Report: model file created/changed, scaffold vs custom CRUD, hooks added, populate/active decisions, consumer code checked/updated, `vp check`/`vp test` results.

## Reference

`node_modules/@vulkano/core/README.md` (§ Models, § Key conventions), `reference/BACKEND.md`. Worked examples: `node_modules/@vulkano/core/examples/models/Example.js` (custom CRUD + hooks + autopopulate), `ExampleWithScaffold.js` (scaffold). Populate internals: `node_modules/@vulkano/core/database/scaffold.js` (`_buildPopulate`/`_parsePopulateEntries`).
