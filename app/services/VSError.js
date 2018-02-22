/* global app */

const Promise = require('bluebird');

function VSError(msg, code) {

  Error.captureStackTrace(this, this.constructor);

  this.message = msg;
  this.statusCode = code || 500;
  if (app.PRODUCTION) {
    delete this.stack;
  }

}

// Not Found Object
VSError.notFound = (n) => {
  const name = n || 'Object';
  return Promise.reject(new VSError(`${name} Not Found`, 404));
};

// Reject request
VSError.reject = (text, status) => Promise.reject(new VSError(text, status));

// Extending of native error object
require('util').inherits(VSError, Error);

module.exports = VSError;
