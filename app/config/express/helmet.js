/**
 *
 * Helmet Config
 * Documentation: https://helmetjs.github.io/#reference
 *
 */

module.exports = {

  //
  // @type Object
  // 
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  //
  // @type Boolean
  // 
  contentSecurityPolicy: false,

  //
  // @type Boolean
  // 
  crossOriginEmbedderPolicy: false

};
