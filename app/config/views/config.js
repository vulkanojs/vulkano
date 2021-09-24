const path = require('path');
const globals = require('./globals');
const filters = require('./filters');

module.exports = {

  path: path.join(process.cwd(), 'app/views'),

  engine: 'nunjucks', // or ejs

  globals: [globals],

  filters: [filters]

};
