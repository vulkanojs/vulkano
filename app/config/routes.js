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
  '/cms': 'CmsController.get'

  // Catch-alls for Vue Router (SPA) — each scoped one must come before
  // the generic '/*' so it isn't shadowed, and all must stay last so
  // they never shadow /api/* convention routes, which @vulkano/core
  // registers before config/routes.js entries. Without these, a hard
  // refresh on any client-side route 404s at the server. Uncomment
  // once each area has more than one route:
  // '/cms/*': 'CmsController.get',
  // '/*': 'HomeController.get',
};
