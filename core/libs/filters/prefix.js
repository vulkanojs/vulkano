/**
 * Filter prefix
 *
 * Filter.get('custom string', 'prefix', '/');
 * return '/custom string'
 *
 */
module.exports = {

  exec: (_str, opt) => {

    const str = _str || '';

    if (str.indexOf(opt) === 0) {
      return str;
    }

    return opt + str;

  }

};
