/**
 *
 * Express JSON Config
 * https://expressjs.com/en/api.html#express.json
 *
 */
module.exports = {
  
  // 
  // This is used to determine what media type the middleware will parse.
  // @type Array
  // 
  type: [
    'application/json',
    'application/csp-report',
    'application/reports+json',
  ]
  
};
