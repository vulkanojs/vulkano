/* global __dirname */

/**
 * Controllers
 */

const path = require('path');

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/controllers')),
  filter: /(.+Controller)\.js$/,
  optional: true
});

module.exports = function loadControllersApplication() {

  const routes = {};
  Object.keys(AllControllers).forEach((controller) => {

    const methods = ['get', 'post', 'put', 'delete'];
    let moduleName = '';
    let method = 'get';
    let pathToRoute = '';
    let controllerName = controller.replace('Controller', '').toLowerCase();
    const current = AllControllers[controller];

    Object.keys(AllControllers).forEach((route) => {

      if (route.split('Controller').length > 1) {
        moduleName = controllerName;
        const submodules = AllControllers[moduleName] || [];

        Object.keys(submodules).forEach((subcontroller) => {

          controllerName = subcontroller.replace('Controller', '').toLowerCase();
          const subcurrent = submodules[subcontroller] || [];

          Object.keys(subcurrent).forEach((subroute) => {

            const tmpParts = subroute.split(' ');
            pathToRoute = (tmpParts.length > 1) ? tmpParts[1] : tmpParts[0];
            if (tmpParts.length > 1) {
              method = tmpParts[0].toLowerCase();
            }
            const isAbsolute = (pathToRoute.substring(0, 1) === '/');
            if (!isAbsolute) {
              if (methods.indexOf(pathToRoute.toLowerCase()) >= 0) {
                method = pathToRoute.toLowerCase();
                pathToRoute = `/${moduleName}/${controllerName}/`;
              } else {
                pathToRoute = `/${moduleName}/${controllerName}/${pathToRoute.replace(/GET|POST|DELETE|PUT/i, '')}`;
              }
            }
            routes[`${method} ${pathToRoute}`] = subcurrent[subroute];

          });

        });
      } else {
        const tmpParts = route.split(' ');
        pathToRoute = (tmpParts.length > 1) ? tmpParts[1] : tmpParts[0];
        if (tmpParts.length > 1) {
          method = tmpParts[0].toLowerCase();
        }
        const isAbsolute = (pathToRoute.substring(0, 1) === '/');
        if (!isAbsolute) {
          if (methods.indexOf(pathToRoute.toLowerCase()) >= 0) {
            method = pathToRoute.toLowerCase();
            pathToRoute = `/${controllerName}/`;
          } else {
            pathToRoute = `/${controllerName}/${pathToRoute.replace(/GET|POST|DELETE|PUT/i, '')}`;
          }
        }
        routes[`${method} ${pathToRoute}`] = current[route];
      }
    });

  });

  return routes;

};
