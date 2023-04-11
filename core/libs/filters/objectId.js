/**
 * Filter Object ID
 *
 * Filter.get('new ObjectId("aiuijdñjñ8987987")', 'objectId');
 * return 'aiuijdñjñ8987987'
 *
 */
module.exports = {

  exec: (_id) => {
    return String(_id || '').replace(/ObjectId\("(.*)"\)/, '$1');
  }

};
