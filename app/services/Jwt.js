/* global Encrypter */

const { expressjwt: JWT } = require('express-jwt');
const jwtSimple = require('jwt-simple');
const moment = require('moment');

module.exports = {

  getConfig() {

    const {
      jwt,
      // Express config folder in app/confg/express
      express
    } = app.config || {};

    const {
      jwt: expressJwt,
    } = express || {};

    return jwt || expressJwt || {};

  },

  init(opts) {

    const {
      key,
      header,
      queryParameter,
      cookieName
    } = this.getConfig();

    const config = {

      algorithms: ['HS256'],

      secret: key,

      getToken: (req) => {

        // Get Token via HTTP header
        const headerToken = req.headers[header] || req.headers[header.toUpperCase()] || null;

        // Get Token via Cookie
        const cookieToken = req.cookies && req.cookies[cookieName]
          ? req.cookies[cookieName]
          : null;

        // Get Token via Query Parameter
        const queryToken = req.query && req.query[queryParameter]
          ? req.query[queryParameter]
          : null;

        // Current Token
        const token = headerToken || cookieToken || queryToken || null;

        // Decode Token
        const hasData = this.decode(token);

        // Return only if token is valid
        return hasData ? token : null;

      }

    };

    return JWT({ ...config, ...opts });

  },

  encode(data) {

    const {
      key
    } = this.getConfig();

    const Encrypt = new Encrypter(`${key}-JWT`);
    const payload = Encrypt.encrypt(JSON.stringify({ data }));

    return jwtSimple.encode(payload, key);

  },

  decode(token, customKey) {

    const {
      key
    } = this.getConfig();

    let data = {};
    try {

      const payload = jwtSimple.decode(token, customKey || key);
      data = this.decrypt(payload);

    } catch (e) {
      console.log('Invalid Token');
    }

    const {
      expiration
    } = data || {};

    const now = moment().format('x');

    // Token expired
    if (expiration && ( Number(now) > Number(expiration) )) {
      return null;
    }

    // Expiration must be required
    if (!expiration) {
      console.log('JWT Without expiration date');
      return null;
    }

    return data;

  },

  decrypt(str) {

    const {
      key
    } = this.getConfig();

    const Encrypt = new Encrypter(`${key}-JWT`);

    let data = null;
    try {
      const r = JSON.parse(Encrypt.dencrypt(str));
      const {
        data: result
      } = r || {};
      data = result;
    } catch (e) {
      data = null;
    }

    return data;

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
