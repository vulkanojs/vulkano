/**
 * Filter
 *
 * Filter.get(' custom string', 'trim');
 * return 'custom
 *
 */
const path = require('path');

// Include all api controllers
const coreFilters = require('include-all')({
  dirname: path.join(CORE_PATH, '/libs/filters'),
  filter: /(.+)\.js$/,
  optional: true
});

const appFilters = require('include-all')({
  dirname: path.join(APP_PATH, '/services/filters'),
  filter: /(.+)\.js$/,
  optional: true
});

const allFilters = { ...coreFilters, ...appFilters };

module.exports = {

  get(str, filters, opts) {

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

  load(filter) {

    if (!allFilters[filter]) {
      console.error('FILTER', filter, 'NOT FOUND INTO /app/services/filters');
      return false;
    }

    return allFilters[filter];

  }

};
