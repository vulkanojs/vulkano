/* global __dirname, Filter */

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

  get: (str, filters, opts) => {

    let result = null;

    if (Array.isArray(filters)) {
      filters.forEach((filter) => {
        const f = Filter.load(filter);
        result = (!f) ? '' : f.exec(str, opts);
      });
      return result;
    }

    const f = Filter.load(filters);
    return (!f) ? '' : f.exec(str, opts);

  },

  load: (filter) => {

    if (!AllFilters[filter]) {
      console.error('FILTER', filter, 'NOT FOUND INTO /app/services/filters');
      return false;
    }
    return AllFilters[filter];

  }

};
