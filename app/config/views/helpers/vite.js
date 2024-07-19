module.exports = (props) => {

  const {
    entry,
    type
  } = props || {};

  const {
    url,
    inputs
  } = app.vite || {};

  const {
    version
  } = app.pkg || {};

  const validEntry = Object.keys(inputs).find( (k) => k.indexOf(entry) >= 0 );

  if (!validEntry) {
    return `<!-- Invalid Entry ${entry} -->`;
  }

  const currentEntry = inputs[validEntry];

  const {
    file,
    css
  } = currentEntry || {};

  if (type === 'styles' || type === 'style') {
    return (css || []).map( (s) => `<link rel="stylesheet" href="${url || '/'}${s}?v=${version}">`).join('\n');
  }

  if (type === 'script') {

    // Development
    if (typeof currentEntry === 'string') {
      return [
        '<!-- development -->',
        `<script type="module" src="${url}@vite/client"></script>`,
        `<script type="module" src="${url || '/'}${currentEntry}"></script>`
      ].join('\n');
    }

    // Production
    return `<script type="module" src="${url || '/'}${file}?v=${version}"></script>`;

  }

  return '';

};
