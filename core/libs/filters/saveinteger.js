/**
 * Filter Save Integer
 *
 * Filter.get('580937985977360003193018', 'saveinteger');
 * return true or false
 *
 */
module.exports = {

  exec: (str) => {

    const tmpFn = Number.isSafeInteger || ((value) => {
      const isValid = Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
      return isValid;
    });

    return tmpFn(str);

  }

};
