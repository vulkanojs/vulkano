/**
 * Filter ltrim
 *
 * Filter.get('custom string', 'ltrim', 'cus');
 * return 'tom string'
 *
 */
module.exports = {

  exec: (_str, opt) => {
    let str = _str || '';
    if (opt) {
      while (str.charAt(0) === opt) {
        str = str.substr(1, str.length - 1);
      }
    } else {
      while (str.charAt(0) === ' ') {
        str = str.substr(1, str.length - 1);
      }
    }
    return str;
  }

};
