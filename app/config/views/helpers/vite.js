/**
 * Custom backend integration for Vite asset injection.
 * Reads the Vite manifest (dev or production) from `app.vite` to dynamically
 * inject the correct <script> or <link> tags into Nunjucks templates.
 * Supports two asset types via the `type` param: "script" and "style(s)".
 * In development, it emits the Vite HMR client + module entry; in production
 * it resolves the hashed filenames from the manifest and appends a cache-bust
 * query string using the app version.
 *
 * In your template, you can define the CSS and JS entries like this:
 *
 * CSS: {{ vite({ entry: 'app', type: 'style' }) | safe }}
 * JS: {{ vite({ entry: 'app', type: 'script' }) | safe }}
 *
 */
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
