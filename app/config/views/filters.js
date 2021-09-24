const path = require('path');

// Include all api config
const filters = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '/filters')),
  filter: /(.+)\.js$/,
  optional: true
});

module.exports = filters;
