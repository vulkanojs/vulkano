/**
 * Alias Route Mappings
 *
 * Your routes map URLs to views and controllers.
 */

module.exports = {

  // Content Security Policy
  // 'POST /__cspreport__': 'ExampleController.cspreport',

  '/': 'HomeController.get',

  // Vite Proxy
  '/*': process.env.NODE_ENV !== 'production' ? 'HomeController.proxy' : 'HomeController.get'

  // For VUE, REACT, ETC..
  // '/admin*': 'AdminController.get',
  // '/*': 'HomeController.get'

};
