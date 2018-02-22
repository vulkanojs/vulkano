/* global __dirname */

/**
 * Services
 */

const path = require('path');

// Include all services
const AllServices = require('include-all')({
  dirname: path.join(__dirname, '../app/services'),
  filter: /(.+)\.js$/,
  optional: true
});

module.exports = function loadServicesApplication() {

  delete AllServices.ActiveRecord;
  delete AllServices.AppController;

  Object.keys(AllServices).forEach((service) => {
    global[service] = AllServices[service];
  });

};
