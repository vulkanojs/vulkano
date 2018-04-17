/* global app */

const jwt = require('express-jwt');
const jwtSimple = require('jwt-simple');

module.exports = {

  init: (opts) => {

    const key = app.config.jwt.key || '';
    const header = app.config.jwt.header || 'x-token-auth' || '';
    const param = app.config.jwt.queryParameter || '';
    const config = {
      secret: key,
      getToken: function fromHeaderOrQuerystring(req) {
        return req.headers[header]
          || req.headers[header.toUpperCase()]
          || (param && req.query && req.query[param.toLowerCase()])
          || null;
      }
    };

    return jwt(Object.assign({}, config, opts));

  },

  encode: data => jwtSimple.encode(data, app.config.jwt.key || ''),

  decode: (token, customKey) => jwtSimple.decode(token, customKey || app.config.jwt.key || '')

};
