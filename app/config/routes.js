/**
 * Alias Route Mappings
 *
 * Your routes map URLs to views and controllers.
 *
 * Notes: Vulkano automatically matches the URL to a controller
 * and HTTP method (get, post, put, delete) ;)
 *
 * Example:
 * - GET /users/ -> File: UsersController, Method: 'get': (req, res) => {}
 * - GET /users/123 -> File: UsersController, Method: 'get :id': (req, res) => {}
 * - POST /users/ -> File: UsersController, Method: 'post': (req, res) => {}
 * - PUT /users/123 -> File: UsersController, Method: 'put :id': (req, res) => {}
 * - DELETE /users/123 -> File: UsersController, Method: 'delete :id': (req, res) => {}
 *
 * With nested folders, the same rules apply:
 * - GET /api/users/123 -> Folder: api -> File: UsersController, Method: 'get :id': (req, res) => {}
 *
 * But you can write your own routes manually :P
 *
 */

module.exports = {
  '/': 'HomeController.get',
  '/admin': 'AdminController.get'

  // Catch-alls for Vue Router (SPA) — ONLY for a Vue app entrypoint under
  // frontend/, not for a plain server-rendered page (see
  // vulkano-backend-views for that decision). Each scoped one must come
  // before the generic '/*' so it isn't shadowed, and all must stay last
  // so they never shadow /api/* convention routes, which @vulkano/core
  // registers before config/routes.js entries. Without these, a hard
  // refresh on any client-side route 404s at the server. Every Vue
  // entrypoint needs its own scoped catch-all (uncomment it, or add
  // '/<name>/*' for a new one) plus a NotFound route in its frontend
  // routes.js, even while it has a single route:
  // '/admin/*': 'AdminController.get',
  // '/*': 'HomeController.get',
};
