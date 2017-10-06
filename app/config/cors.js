/**
 * CORS Config
 *
 *
 */

module.exports = {

  //
  // Enable CORS
  // @type Boolean
  //
  enable: true,

  //
  // Path
  // @type String
  //
  path: '/',

  //
  // Origin
  // @type String
  //
  origin: '*',

  //
  // Headers
  // @type Array
  //
  headers: ['x-token-auth']

};
