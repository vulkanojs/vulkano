/**
 * Services
 */

const path = require('path');

// Include all libs & services
const coreLibs = require('include-all')({
  dirname: path.join(CORE_PATH, '/libs'),
  filter: /(.+)\.js$/,
  optional: true
});

const appServices = require('include-all')({
  dirname: path.join(APP_PATH, '/services'),
  filter: /(.+)\.js$/,
  optional: true
});

const allServices = { ...coreLibs, ...appServices };

module.exports = function loadServicesApplication() {

  delete allServices.ActiveRecord;
  delete allServices.AppController;

  Object.keys(allServices).forEach((service) => {
    global[service] = allServices[service];
  });

};
