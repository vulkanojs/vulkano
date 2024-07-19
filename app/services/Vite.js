const fs = require('fs');

module.exports = {

  buildPath: '',

  init(buildPath) {

    this.buildPath = buildPath || 'public';

    // we must have a manifest file...
    let manifestPath = null;

    const env = String(process.env.NODE_ENV || 'development').toLowerCase();
    const isProd = env === 'production' ? true : false;

    try {
      manifestPath = isProd
        ? fs.readFileSync(`${this.buildFolder()}/manifest.json`, 'utf8')
        : fs.readFileSync(`${this.buildFolder()}/manifest.${env}.json`, 'utf8');
    } catch {
      manifestPath = null;
    }

    if (!manifestPath) {
      if (isProd) {
        console.log(`No Vite Manifest exists. Path: ${this.buildFolder()}/manifest.json. Should hot server be running?`);
      } else {
        console.log(`No Vite Manifest exists. Path: ${this.buildFolder()}/manifest.${env}.json. Should hot server be running?`);
      }
    }

    const manifest = JSON.parse(manifestPath || '{}');

    const {
      url
    } = manifest || {};

    if (!url) {

      return {
        url: '',
        inputs: manifest
      };

    }

    return manifest;

  },

  buildFolder() {

    return [ABS_PATH, this.buildPath].join('/');

  }

};
