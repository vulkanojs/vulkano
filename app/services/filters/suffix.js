/**
 * Filter suffix
 *
 * Filter.get('custom string', 'suffix', '/');
 * return 'custom string/'
 *
 */
module.exports = {

  exec: function (str, opt) {

    if (str.endsWith(opt)) {
      return str;
    } else {
      return str + opt;
    }

  }

};