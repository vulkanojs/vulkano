const path = require('path');

// Include all api config
const helpers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '/helpers')),
  filter: /(.+)\.js$/,
  optional: true
});

module.exports = helpers;
