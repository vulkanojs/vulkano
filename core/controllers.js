/**
 * Controllers
 */

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: `${APP_PATH}/controllers`,
  filter: /(.+Controller)\.js$/,
  optional: true
});

const scaffoldController = require('./scaffold/controller');

module.exports = function loadControllersApplication() {

  const routes = {};

  Object.keys(AllControllers).forEach( (controller) => {

    const methods = ['get', 'post', 'put', 'delete'];
    const current = AllControllers[controller];

    const {
      scaffold,
      model
    } = current;

    if (scaffold && model) {

      const scaffoldingCurrent = scaffoldController(model);

      Object.keys(scaffoldingCurrent).forEach( (m) => {

        if (!current[m]) {
          current[m] = scaffoldingCurrent[m];
        }

      });

    }

    let controllerName = controller.replace('Controller', '').toLowerCase();

    let parts = [];
    let method = 'get';
    let pathToRun = '';
    let moduleName = '';

    Object.keys(current || []).forEach( (route) => {

      // Is a submodule (like api/TestController)
      if (route.split('Controller').length > 1) {

        moduleName = controllerName;
        const submodules = AllControllers[moduleName];

        Object.keys(submodules || []).forEach( (subcontroller) => {

          controllerName = subcontroller.replace('Controller', '').toLowerCase();
          const subcurrent = submodules[subcontroller];

          const {
            scaffold: subcurrentScaffold,
            model: subcurrentModel
          } = subcurrent || {};

          if (subcurrentScaffold && subcurrentModel) {

            const scaffoldingSubcurrent = scaffoldController(subcurrentModel);

            Object.keys(scaffoldingSubcurrent).forEach( (m) => {

              if (!subcurrent[m]) {
                subcurrent[m] = scaffoldingSubcurrent[m];
                console.log('adding', m);
              }

            });

          }

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

            if (typeof subcurrent[subroute] === 'function') {
              routes[`${method} ${pathToRun}`] = subcurrent[subroute];
            }

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

        if (typeof current[route] === 'function') {
          routes[`${method} ${pathToRun}`] = current[route];
        }

      }

    });

  });

  return routes;

};
