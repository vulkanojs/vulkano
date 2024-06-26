/**
 * Middleware.js
 *
 * This file intercept all requests to make validations before running a controller
 *
 */
module.exports = (req, res, next) => {

  const {
    auth: authEncripted
  } = req;

  if (authEncripted) {
    const decoded = Jwt.decrypt(authEncripted);
    req.auth = (decoded) ? { ...decoded, token: Jwt.getToken(req) } : {};
  }

  // Remove this line if you need make validations
  next();

  //
  // You can make validations to check ACL or anything before to run a controller
  // Example:
  //

  /*
  if (req.auth && +req.auth.role !== 1) {
    const data = {
      success: false,
      error: 'You don\'t have permissions to access this option.'
    }
    res.status(403).jsonp(data);
  } else {
    next();
  }
  */

};
