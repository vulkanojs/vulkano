/**
 * Alias Route Mappings
 *
 * Your routes map URLs to views and controllers.
 */

module.exports = {

  // Content Security Policy
  // 'POST /__cspreport__': 'ExampleController.cspreport',

  // Vite & Vite Proxy
  '/': 'ViteController.get',
  '/*': 'ViteController.proxy'

  // For admin VUE, REACT, ETC..
  // '/admin*': 'AdminController.get',
  // '/*': 'HomeController.get'

};
