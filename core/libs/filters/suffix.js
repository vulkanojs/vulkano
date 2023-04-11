/**
 * Filter suffix
 *
 * Filter.get('custom string', 'suffix', '/');
 * return 'custom string/'
 *
 */
module.exports = {

  exec: (str, opt) => {

    if (str.endsWith(opt)) {
      return str;
    }
    return str + opt;

  }

};
