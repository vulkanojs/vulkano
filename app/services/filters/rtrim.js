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
      while (str.charAt(str.length - 1) === opt) {
        str = str.substr(0, str.length - 1);
      }
    } else {
      while (str.charAt(str.length - 1) === ' ') {
        str = str.substr(0, str.length - 1);
      }
    }
    return str;
  }

};
