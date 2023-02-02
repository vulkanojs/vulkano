/**
 * VULKANO STANDARD RESPONSE (VSR)
 */

const Promise = require('bluebird');

module.exports = function VSRPromise(promiseToRun, httpStatusCode) {

  const {
    req
  } = this;

  const {
    res,
    path
  } = req;

  let code = httpStatusCode || 200;
  let output = {
    success: true,
    statusCode: code
  };

  if (!promiseToRun || !promiseToRun.then) {

    // Log error to console
    console.log('The response is not a promise');
    return res.status(500).jsonp({
      success: false,
      error: {
        detail: 'The response is not a promise.'
      }
    });

  }

  // Executing promise
  promiseToRun
    .then( (r) => {

      if ( (r.statusCode && r.statusCode >= 400) || output.statusCode >= 400) {

        if (r.statusCode && r.statusCode !== 402) {
          return Promise.reject(r);
        }

        if ( output.statusCode >= 400 && output.statusCode !== 402 ) {
          return Promise.reject(r);
        }

        output.statusCode = r.statusCode;
        code = r.statusCode;

      }

      if (r && r.serialized) { // if the object has serialized? see services/Serializer
        output = { ...output, ...r };
        delete output.serialized;
      } else {
        output.data = r;
      }

      return true;

    })
    .catch( (e) => {

      if (path) {
        console.log('ERROR PATH', path);
      }

      if (!app.PRODUCTION) {
        console.log(e);
      }

      const message = e.message !== undefined && typeof e.message === 'object' ? e.message : e;
      code = message.statusCode || e.statusCode || 400;

      // Output
      output.success = false;
      output.statusCode = code;
      output.error = {
        errorCode: message.code || '001',
        errorName: message.name || 'BadRequest',
        detail: message.message || message.error || message.invalidAttributes || message.toString(),
        output: message
      };

    })
    .finally( () => res.status(code).jsonp(output) );

};
