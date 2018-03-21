module.exports = {

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

  }

};
