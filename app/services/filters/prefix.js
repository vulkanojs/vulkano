/**
 * Filter prefix
 *
 * Filter.get('custom string', 'prefix', '/');
 * return '/custom string'
 *
 */
module.exports = {

  exec: function (str, opt) {

    if (str.indexOf(opt) === 0) {
      return str;
    } else {
      return opt + str;
    }

  }

};