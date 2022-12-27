const https = require('https');
const http = require('http');
const fs = require('fs');

module.exports = {

  getSlug(str, separator) {

    return String(str).replace(/-/g, ' ').normalize('NFD') // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, separator || '-');

  },

  accentToRegex: (_text) => {

    const ACCENT_STRINGS = 'ŠŒŽšœžŸ¥µÀÁÂÃÄÅÆÇÈÉÊËẼÌÍÎÏĨÐÑÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëẽìíîïĩðñòóôõöøùúûüýÿ';
    const NO_ACCENT_STRINGS = 'SOZsozYYuAAAAAAACEEEEEIIIIIDNOOOOOOUUUUYsaaaaaaaceeeeeiiiiionoooooouuuuyy';

    const from = ACCENT_STRINGS.split('');
    const to = NO_ACCENT_STRINGS.split('');
    const result = [];
    let text = _text;

    to.forEach( (letter, key) => {
      const exist = result.indexOf(letter);
      if (exist >= 0) {
        result[exist] += from[key];
      } else {
        result.push(letter);
      }
    });

    result.forEach( (rg, key) => {
      const regex = new RegExp(`[${rg}]`);
      text = text.replace(regex, `_${key}_`);
    });

    result.forEach( (rg, key) => {
      const regex = new RegExp(`_${key}_`);
      text = text.replace(regex, `[${rg}]`);
    });

    return text;

  },

  download(url, dest, cb) {

    const file = fs.createWriteStream(dest);

    if (url.indexOf('http:') >= 0) {

      http.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(cb);
        });
        file.on('error', (error) => {
          cb(error);
        });
      });

      return;

    }

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(cb);
      });
      file.on('error', (error) => {
        cb(error);
      });
    });

  }

};
