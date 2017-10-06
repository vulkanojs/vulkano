
/* global __dirname */

const fs = require('fs');
const path = require('path');

module.exports = function (req, res, next) {

  // User path
  let userPath = path.normalize(__dirname + "/../app/responses");

  //get custom reponses
  let custom = fs.readdirSync(userPath);

  //add user reponses
  custom.forEach(function (response) {
    let reponseName = response.split('.')[0];
    res[reponseName] = require(userPath + '/' + response);
  });

  next();

};