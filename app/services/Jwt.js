/* global app */

const jwt = require('express-jwt');
const jwtSimple = require('jwt-simple');
const _ = require('underscore');

module.exports = {

  init: function (opts) {

    var key = app.config.jwt.key || '';
    var header = app.config.jwt.header || 'x-token-auth';
    var param = app.config.jwt.queryParameter || 'token';
    var config = {
      secret: key,
      getToken: function fromHeaderOrQuerystring(req) {
        return req.headers[header] ||
                req.headers[header.toUpperCase()] ||
                req.query && req.query[param.toLowerCase()] ||
                null;
      }
    };

    return jwt(_.extend(config, opts));

  },

  encode: function (data) {

    return jwtSimple.encode(data, app.config.jwt.key || '');

  }

};
