const Promise = require('bluebird');

function VSError(msg, code, props) {

  Error.captureStackTrace(this, this.constructor);

  const {
    stack
  } = props || {};

  this.message = msg;
  this.statusCode = code || 500;
  this.customProps = props || {};

  if (app.PRODUCTION || stack === false ) {
    delete this.stack;
  }

}

// Not Found Object
VSError.notFound = (n) => {
  const name = n || 'Object';
  return Promise.reject(new VSError(`${name} Not Found`, 404));
};

// Reject request
VSError.reject = (text, status, props) => Promise.reject(new VSError(text, status, props));

// Extending of native error object
require('util').inherits(VSError, Error);

module.exports = VSError;
