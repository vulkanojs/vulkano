const { expressjwt: JWT } = require('express-jwt');
const jwtSimple = require('jwt-simple');

module.exports = {

  init(opts) {

    const {
      jwt
    } = app.config || {};

    const {
      key,
      header,
      queryParameter,
      cookieName
    } = jwt || {};

    const config = {

      algorithms: ['HS256'],

      secret: key,

      getToken: (req) => {

        const headerToken = req.headers[header] || req.headers[header.toUpperCase()] || null;

        const cookieToken = req.cookies && req.cookies[cookieName]
          ? req.cookies[cookieName]
          : null;

        const queryToken = req.query && req.query[queryParameter]
          ? req.query[queryParameter]
          : null;

        return headerToken || cookieToken || queryToken || null;

      }

    };

    return JWT({ ...config, ...opts });

  },

  encode(data) {

    const {
      key
    } = app.config.jwt;

    return jwtSimple.encode(data, key);

  },

  decode(token, customKey) {

    const {
      key
    } = app.config.jwt;

    return jwtSimple.decode(token, customKey || key);

  }

};
