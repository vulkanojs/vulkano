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

module.exports = function loadServicesApplication() {

  Object.keys(coreLibs).forEach((service) => {
    global[service] = coreLibs[service];
  });

  // eslint-disable-next-line global-require
  const appServices = require('include-all')({
    dirname: path.join(APP_PATH, '/services'),
    filter: /(.+)\.js$/,
    optional: true
  });

  delete appServices.ActiveRecord;
  delete appServices.AppController;

  Object.keys(appServices).forEach((service) => {
    global[service] = appServices[service];
  });

};
