/**
 * Filter Save Integer
 *
 * Filter.get('580937985977360003193018', 'saveinteger');
 * return true or false
 *
 */
module.exports = {

  exec: function (str, opt) {

    var tmpFn = Number.isSafeInteger || function (value) {
      return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
    };

    return tmpFn(str);

  }

};