/**
 * Filter number
 *
 * Filter.get('cu570m 5tr1ng', 'number');
 * return '57051'
 *
 */
module.exports = {

  exec: (_str) => {
    return String(_str || '').replace( /\D+/g, '');
  }

};
