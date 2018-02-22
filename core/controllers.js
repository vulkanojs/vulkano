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
  Object.keys(AllControllers).forEach( (controller) => {
    const methods = ['get', 'post', 'put', 'delete'];
    const current = AllControllers[controller];
    let controllerName = controller.replace('Controller', '').toLowerCase();
    let parts = [];
    let method = 'get';
    let pathToRun = '';
    let moduleName = '';
    Object.keys(current || []).forEach( (route) => {
      if (route.split('Controller').length > 1) {
        moduleName = controllerName;
        const submodules = AllControllers[moduleName];

        Object.keys(submodules || []).forEach( (subcontroller) => {

          controllerName = subcontroller.replace('Controller', '').toLowerCase();
          const subcurrent = submodules[subcontroller];

          Object.keys(subcurrent || []).forEach( (subroute) => {
            parts = subroute.split(' ');
            const [tmpMethod, tmpPath] = parts;
            if (tmpPath) {
              method = tmpMethod.toLowerCase();
              pathToRun = tmpPath;
            } else {
              pathToRun = tmpMethod;
            }

            const isAbsolute = (pathToRun.substring(0, 1) === '/') ? true : false;
            if (!isAbsolute) {
              if (methods.indexOf(pathToRun.toLowerCase()) >= 0) {
                method = pathToRun.toLowerCase();
                pathToRun = `/${moduleName}/${controllerName}/`;
              } else {
                pathToRun = `/${moduleName}/${controllerName}/${pathToRun.replace(/GET|POST|DELETE|PUT/i, '')}`;
              }
            }
            routes[`${method} ${pathToRun}`] = subcurrent[subroute];

          });
        });
      } else {
        parts = route.split(' ');
        const [tmpMethod, tmpPath] = parts;
        if (tmpPath) {
          method = tmpMethod.toLowerCase();
          pathToRun = tmpPath;
        } else {
          pathToRun = tmpMethod;
        }
        const isAbsolute = (pathToRun.substring(0, 1) === '/') ? true : false;
        if (!isAbsolute) {
          if (methods.indexOf(pathToRun.toLowerCase()) >= 0) {
            method = pathToRun.toLowerCase();
            pathToRun = `/${controllerName}/`;
          } else {
            pathToRun = `/${controllerName}/${pathToRun.replace(/GET|POST|DELETE|PUT/i, '')}`;
          }
        }
        routes[`${method} ${pathToRun}`] = current[route];
      }
    });
  });

  return routes;

};
