/* global app */

var Promise = require('bluebird');

function VSError(msg, code) {

  Error.captureStackTrace(this, this.constructor);

  this.message = msg;
  this.statusCode = code || 500;
  if (app.PRODUCTION) {
    delete this.stack;
  }

}

// Not Found Object
VSError.notFound = function (n) {
  var name = n ? n + ' ' : '';
  return Promise.reject(new VSError(name + 'Not Found', 404));
};

// Reject request
VSError.reject = function (text, status) {
  return Promise.reject(new VSError(text, status));
};

//extending of native error object
require('util').inherits(VSError, Error);

module.exports = VSError;
