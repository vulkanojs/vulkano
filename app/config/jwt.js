/**
 * JWT Config
 *
 *
 */

module.exports = {

  //
  // Enable JWT
  // @type Boolean
  //
  enable: true,

  //
  // Custom KEY
  // You can use this https://api.wordpress.org/secret-key/1.1/salt/ to change key
  // @type String
  //
  key: '[hSG1YnA[A](6[|7s/=`.l8(Ikos>QW?8Q{_/7m<fvDSej(nGf{AqL$Z:!/ehrd?',

  //
  // header name via Request
  // @type String
  //
  header: 'x-token-auth',

  //
  // Get token via url
  // value: string
  // @type String
  //
  queryParameter: 'token',

  //
  // Path to make mandatory the token
  // Example /api/
  // @type String
  //
  path: '/api/',

  //
  // Path to ignore token request
  // Example: ['/api/auth', '/api/auth/forgot', /^\/api\/events/i]
  // you can see https://github.com/jfromaniello/express-unless to more examples
  // @type Array
  //
  ignore: [
    '/api/',
    /^\/api\/auth/i
  ]

};
