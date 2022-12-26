const { expressjwt: JWT } = require('express-jwt');
const jwtSimple = require('jwt-simple');

module.exports = {

  init(opts) {

    const {
      jwt,
      // Express config folder in app/confg/express
      express
    } = app.config || {};

    const {
      jwt: expressJwt,
    } = express || {};

    const {
      key,
      header,
      queryParameter,
      cookieName
    } = jwt || expressJwt || {};

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
      jwt,
      // Express config folder in app/confg/express
      express
    } = app.config || {};

    const {
      jwt: expressJwt,
    } = express || {};

    const {
      key
    } = jwt || expressJwt || {};

    return jwtSimple.encode(data, key);

  },

  decode(token, customKey) {

    const {
      jwt,
      // Express config folder in app/confg/express
      express
    } = app.config || {};

    const {
      jwt: expressJwt,
    } = express || {};

    const {
      key
    } = jwt || expressJwt || {};

    return jwtSimple.decode(token, customKey || key);

  },

  socket(socket) {

    const {
      token
    } = socket.handshake.auth || {};

    if (token === null || typeof token === 'undefined' || !token) {
      return false;
    }

    // Development
    let payload = this.decode(token);

    // Production
    if (!payload) {
      payload = this.decode(token);
    }

    const {
      data
    } = payload || {};

    const {
      user
    } = data || {};

    const {
      id
    } = user || {};

    if (!id) {
      return false;
    }

    return user;

  }

};
