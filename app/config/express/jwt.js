/**
 *
 * JWT Config
 *
 */

module.exports = {

  //
  // Enable JWT
  // @type Boolean
  //
  enabled: false,

  //
  // Custom KEY
  // You can use this https://api.wordpress.org/secret-key/1.1/salt/ to change key
  // @type String
  //
  key: process.env.JWT_SECRET_KEY || '',

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
  // Get token via cookie
  // value: string
  // @type String
  //
  cookieName: 'token',

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
  //
  // To allow the enpoint to verify token replace the api path for /^\/api\/auth(?!\/(current))/i
  //
  // @type Array
  //
  ignore: [
    '/api/',
    /^\/api\/auth(?!\/(current))/i
  ]

};
