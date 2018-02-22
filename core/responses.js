
/* global __dirname */

const path = require('path');

// Include all user's responses
const AllResponses = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/responses')),
  optional: true
});

module.exports = function loadResponsesApplication(req, res, next) {

  // add user reponses
  Object.keys(AllResponses).forEach((response) => {
    const reponseName = response.split('.')[0];
    res[reponseName] = AllResponses[response];
  });

  next();

};
