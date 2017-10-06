/* global req */

const Promise = require('bluebird');

module.exports = function VSRPromise(prom, okcode) {

  let req = this.req;
  let res = req.res;

  let code = okcode || 200;
  let output = {
    success: true,
    statusCode: code
  };

  if (!prom || !prom.then) {

    // Log error to console
    console.log('The response is not a promise');
    return res.status(500).jsonp({success: false, error: 'The response is not a promise.'});

  } else {

    //executing promise
    prom.then(function (r) {

      console.log('entra', output.statusCode);
      if (output.statusCode >= 400) {
        return Promise.reject(r);
      }

      if (r && r.serialized) { // if the object has serialized? see services/Serializer
        output = Object.assign({}, output, r);
        delete output.serialized;
      } else {
        output.data = r;
      }

    }).catch(function (e) {

      let message = e.message !== undefined && typeof e.message === 'object' ? e.message : e;
      code = message.statusCode || e.statusCode || 400;

      // Output
      output.success = false;
      output.statusCode = code;
      output.error = {
        errorCode: message.code || '001',
        errorName: message.name || 'BadRequest',
        detail: message.message || message.error || message.invalidAttributes || message.toString(),
        output: message
      };

    }).finally(function () {

      return res.status(code).jsonp(output);

    });

  }

};
