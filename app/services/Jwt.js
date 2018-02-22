/* global app */

const jwt = require('express-jwt');
const jwtSimple = require('jwt-simple');
const _ = require('underscore');

module.exports = {

  init: (opts) => {

    const key = app.config.jwt.key || '';
    const header = app.config.jwt.header || 'x-token-auth';
    const param = app.config.jwt.queryParameter || 'token';
    const config = {
      secret: key,
      getToken: function fromHeaderOrQuerystring(req) {
        return req.headers[header] ||
                req.headers[header.toUpperCase()] ||
                (req.query && req.query[param.toLowerCase()]) ||
                null;
      }
    };

    return jwt(_.extend(config, opts));

  },

  encode: data => jwtSimple.encode(data, app.config.jwt.key || '')

};
