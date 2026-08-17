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

  // Catch-all for Vue Router (SPA) — must stay last so it never shadows
  // /api/* convention routes, which @vulkano/core registers before
  // config/routes.js entries. Without this, a hard refresh on any
  // client-side route (e.g. /login, /forbidden) 404s at the server.
  // '/*': 'HomeController.get',

};
