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
 * But you can write your own routes manually
 *
 */

module.exports = {

  // Content Security Policy
  // 'POST /__cspreport__': 'ExampleController.cspreport',

  /**
   * Your Routes as mapping
   * - Easy mode
   */
  '/': 'HomeController.get',
  '/admin*': 'HomeController.cms',

  /**
   * Your Routes as definition
   * - Most flexible
   */
  // '/test': (req, res) => {
  //   res.json({ message: 'Hola, mundo!' });
  // },

  /**
   * Your Routes as method
   * - More Advanced
   */
  // custom() {

  //   app.get('/test', (req, res) => {
  //     res.json({ hola: 'mundo' });
  //   });

  //   app.get('/test2', (req, res) => {
  //     res.json({ hola: 'mundo2' });
  //   });

  //   app.get('/test3', (req, res) => {
  //     res.json({ hola: 'mundo3' });
  //   });

  // },

  // For VUE, REACT, ETC..
  // '/admin*': 'AdminController.get',
  // '/*': 'HomeController.get'

};
