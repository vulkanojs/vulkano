/* global Promise */

/**
 * Local Bootstrap
 */

module.exports = (start) => {

  Promise
    .resolve()
    .then( () => {

      // Start app
      start();
    });

};
