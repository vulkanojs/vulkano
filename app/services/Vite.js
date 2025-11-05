const fs = require('fs');

module.exports = {

  init(buildPath) {

    // we must have a manifest file...
    let manifestPath = null;

    const viteFolder = [ABS_PATH, (buildPath || 'public/.vite')].join('/');

    const env = String(process.env.NODE_ENV || 'development').toLowerCase();

    const isProd = env === 'production' ? true : false;

    // Get the main manifest file
    if (fs.existsSync(`${viteFolder}/manifest.json`)) {
      manifestPath = fs.readFileSync(`${viteFolder}/manifest.json`, 'utf8');
    }

    // if in dev, try to get the env specific manifest file
    if (!isProd) {
      if (fs.existsSync(`${viteFolder}/manifest.${env}.json`)) {
        manifestPath = fs.readFileSync(`${viteFolder}/manifest.${env}.json`, 'utf8');
      } else if (manifestPath) {
        console.log(`No Vite Manifest for env: ${env} exists. Fallback: manifest.json.`);
      }
    }

    // Show warning if no manifest found
    if (!manifestPath) {
      if (isProd) {
        console.log(`No Vite Manifest exists. Path: ${viteFolder}/manifest.json. Should hot server be running?`);
      } else {
        console.log(`No Vite Manifest exists. Path: ${viteFolder}/manifest.${env}.json. Should hot server be running?`);
      }
    }

    const manifest = JSON.parse(manifestPath || '{}');

    const {
      url
    } = manifest || {};

    if (!url) {

      return {
        env,
        url: '',
        inputs: manifest || {}
      };

    }

    return {
      env,
      ...manifest
    };

  },

  buildFolder() {

    return [ABS_PATH, this.buildPath].join('/');

  }

};
