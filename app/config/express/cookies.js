/**
 *
 * Cookies Config
 *
 */

module.exports = {

  //
  // Enable Cookies
  // @type Boolean
  //
  enabled: true,

  // SECRET KEY to sign the cookie
  // You can use this https://api.wordpress.org/secret-key/1.1/salt/ to change key
  // @type String
  secret: process.env.COOKIES_SECRET_KEY || ''

};
