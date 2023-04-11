/* global Filter */

/**
 * Filter ltrim
 *
 * Filter.get('custom string', 'ltrim', 'cus');
 * return 'tom string'
 *
 */
module.exports = {

  exec: (_str, opt) => {
    const str = Filter.get(_str, ['rtrim', 'ltrim'], opt);
    return str;
  }

};
