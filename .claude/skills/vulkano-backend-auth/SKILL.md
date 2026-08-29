---
name: vulkano-backend-auth
description: Use when adding or reviewing login/logout/session-check authentication in this Vulkano framework project — dedicated Auth/User model, AuthController method-key convention, JWT via httpOnly cookie, and why not to use localStorage/sessionStorage.
---

# Backend Auth

## Overview

The core (`@vulkano/core`) wires JWT (`Jwt.encode`/`Jwt.decode`, `express-jwt` middleware) but doesn't prescribe a model/controller shape. This skill is the template's recommended convention on top of that.

## When to use

- Adding login/logout/session-check to a new project
- Reviewing/editing an existing `AuthController`
- Wiring the frontend router's auth guard against the backend session endpoint (see vulkano-frontend-router)

Not for authorization/role checks on individual routes — that's per-controller business logic, not covered here. Not for the JWT primitives themselves — see `@vulkano/core` README § JWT Authentication.

## Before implementing — secrets in `.env`

Both are `''` by default in the core's config examples — an empty signing key is insecure, so never ship auth wired up without setting these:

- **`JWT_SECRET_KEY`** — signs the JWT itself (`app/config/express/jwt.js`, `key: process.env.JWT_SECRET_KEY`). Required — this is what makes a forged/tampered token detectable.
- **`COOKIES_SECRET_KEY`** — only needed if the cookie is set as a _signed_ cookie (`res.cookie('token', token, { signed: true, ... })`) for tamper-evidence on top of `httpOnly`; requires enabling `app/config/express/cookies.js` (`enabled: true`, `secret: process.env.COOKIES_SECRET_KEY`) — it's disabled and unset by default. Plain `httpOnly` (unsigned) is enough for the XSS protection this skill is about; add signing only when the project also wants tamper-evidence on the cookie value itself.

**If a secret isn't set yet**, don't silently fall back to the core's empty-string default. Either:

1. Ask the user for a value, or
2. Generate one and write it into `.env` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (or the WordPress salt generator linked in the core's own config comments) — then confirm it landed in `.env`, not just in a running process's memory. A secret generated but never persisted invalidates every session on the next restart.

Never commit the generated value anywhere but `.env` (gitignored) — see AGENTS.md § Security considerations.

## Convention

- **Dedicated service/model** — `Auth`/`User` (whichever this app calls it), not login logic bolted onto an unrelated model. Follows vulkano-backend-model for schema/CRUD shape.
- **Dedicated controller** — `app/controllers/api/AuthController.js`, method-key convention (see vulkano-backend-controller):

```js
// app/controllers/api/AuthController.js
module.exports = {
  'post login': (req, res) => {
    // POST /api/auth/login
    User.authenticate(req.body).then((user) => {
      const token = Jwt.encode({ id: user._id });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.vsr(Promise.resolve(user));
    });
  },
  'post logout': (req, res) => {
    // POST /api/auth/logout
    res.clearCookie('token');
    res.vsr(Promise.resolve({}));
  },
  current(req, res) {
    // GET /api/auth/current — no verb prefix needed, GET is default
    res.vsr(req.user ? Promise.resolve(req.user) : VSError.reject('Unauthorized', 401));
  }
};
```

## Token storage — `httpOnly` cookie, never `localStorage`

On successful login, set the JWT as an `httpOnly` (and `secure` in production) cookie — never return it in the response body for client-side storage. `Jwt.getToken(req)` already reads from cookie, header, or query param, so no custom token-extraction logic is needed on subsequent requests.

`localStorage`/`sessionStorage` are readable by any script on the page — a token or user object stored there is exposed to XSS. This applies to the user object too, not just the token: never cache the logged-in user client-side. Fetch it fresh via `GET /api/auth/current` on every route change instead (see vulkano-frontend-router § Auth guard).

## After writing

- Confirm no endpoint response ever returns a password hash or the raw token in its JSON body (`res.vsr` payload) — strip/select fields explicitly (see AGENTS.md § Security considerations).
- Add a test under `test/app/controllers/AuthController.http.test.js` covering login success/failure, logout, and `current` with/without a valid session.
- Run `vp check` and `vp test`.

## Reference

`node_modules/@vulkano/core/README.md` § JWT Authentication, vulkano-backend-model (Auth/User model shape), vulkano-backend-controller (method-key convention), vulkano-frontend-router § Auth guard (frontend consumer side).
