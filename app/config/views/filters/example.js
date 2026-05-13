/**
 * Method to create a filter to use in Nunjucks templates.
 *
 * Example:
 * {{ 'mytext' | example }} => 'm y t e x t'
 *
 * @param {String} example
 * @returns {String}
 */
module.exports = (example) => {

  return (example || '').split('').join(' ');

};
