/* global __dirname */

/**
 * Controllers
 */

const path = require('path');
const _ = require('underscore');

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/controllers')),
  filter: /(.+Controller)\.js$/,
  optional: true
});

module.exports = function () {

  let routes = {};
  for (let controller in AllControllers) {
    let moduleName = '';
    let parts = [];
    let methods = ['get', 'post', 'put', 'delete'];
    let method = 'get';
    let path = '';
    let controllerName = controller.replace('Controller', '').toLowerCase();
    let current = AllControllers[controller];
    for (let route in current) {
      if (route.split('Controller').length > 1) {
        moduleName = controllerName;
        let submodules = AllControllers[moduleName];
        for (let subcontroller in submodules) {
          controllerName = subcontroller.replace('Controller', '').toLowerCase();
          subcurrent = submodules[subcontroller];
          for (let subroute in subcurrent) {
            parts = subroute.split(' ');
            if (parts.length > 1) {
              method = parts[0].toLowerCase();
              path = parts[1];
            } else {
              path = parts[0];
            }
            let isAbsolute = (path.substring(0, 1) === '/') ? true : false;
            if (!isAbsolute) {
              if (methods.indexOf(path.toLowerCase()) >= 0) {
                method = path.toLowerCase();
                path = '/' + moduleName + '/' + controllerName + '/';
              } else {
                path = '/' + moduleName + '/' + controllerName + '/' + path.replace(/GET|POST|DELETE|PUT/i, '');
              }
            }
            routes[method + ' ' + path] = subcurrent[subroute];
          }
        }
      } else {
        parts = route.split(' ');
        if (parts.length > 1) {
          method = parts[0].toLowerCase();
          path = parts[1];
        } else {
          path = parts[0];
        }
        let isAbsolute = (path.substring(0, 1) === '/') ? true : false;
        if (!isAbsolute) {
          if (methods.indexOf(path.toLowerCase()) >= 0) {
            method = path.toLowerCase();
            path = '/' + controllerName + '/';
          } else {
            path = '/' + controllerName + '/' + path.replace(/GET|POST|DELETE|PUT/i, '');
          }
        }
        routes[method + ' ' + path] = current[route];
      }
    }
  }
  return routes;

}();