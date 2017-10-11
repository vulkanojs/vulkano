/* global chai */

const constants = require('./constants');
var helpers = {};

helpers.replace = (str, wc) => {
  return str.replace(/:(\w+)/g, function (m, key) {
    return wc[key] || m;
  });
};

helpers.req = (action, param) => {
  var info = action.split(' ');
  var method = info.length > 1 ? info.shift() : 'get';
  var s = info.shift();
  var r = chai.request(constants.settings.host);
  var url = helpers.replace(s, param);
  var out;
  switch (method) {
    case 'get':
      out = r.get(url);
      break;
    case 'post':
      out = r.post(url);
      break;
    case 'put':
      out = r.put(url);
      break;
    case 'delete':
      out = r.delete(url);
      break;
    default:
      throw 'Invalid Method';
  }
  if (helpers.token) {
    out.set('x-token-auth', helpers.token);
  }
  return out;
};

//LOGIN
helpers.login = function () {
  var r = helpers.req('post /auth/login');
  r.send({email: constants.email, password: constants.password});
  return r.then(function (res) {
    var body = res.body.data;
    helpers.token = body.token;
    return r;
  });
};

module.exports = helpers;
