/* global __dirname */

/**
 * Filter
 *
 * Filter.get(' custom string', 'trim');
 * return 'custom
 *
 */
const path = require('path');

// Include all api controllers
const AllFilters = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '/filters')),
  filter: /(.+)\.js$/,
  optional: true
});

module.exports = {

  get: function (str, filters, opts) {

    var _this = this;

    if (Array.isArray(filters)) {
      filters.forEach(function (filter) {
        var f = _this.load(filter);
        str = (!f) ? '' : f.exec(str, opts);
      });
      return str;
    } else {
      var f = _this.load(filters);
      return (!f) ? '' : f.exec(str, opts);
    }

  },

  load: function (filter) {
    if (!AllFilters[filter]) {
      console.error("FILTER", filter, "NOT FOUND INTO /app/services/filters");
      return false;
    }
    return AllFilters[filter];
  }

};