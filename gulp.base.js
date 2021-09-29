/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const gulp = require('gulp');
const nodeSass = require('gulp-sass')(require('node-sass'));
const rename = require('gulp-rename');
const gif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const browser = require('browser-sync').create();

module.exports = (settings) => {

  const dev = String(process.env.NODE_ENV || 'development').toLowerCase() !== 'production';

  const postcssList = [
    autoprefixer({
      overrideBrowserslist: [
        'last 10 version',
        '> 5%'
      ]
    })
  ];

  if (!dev) {
    postcssList.push(cssnano({
      safe: true
    }));
  }

  // Delete the "dist" folder
  // This happens every time a build starts
  function clean(done) {
    done();
  }

  // Start a server with BrowserSync to preview the site in
  function browserSync(done) {
    if (dev) {
      setTimeout( () => {
        browser.init(settings.server);
      }, 5000);
    }
    done();
  }

  // BrowserSync Reload
  function browserSyncReload(done) {
    if (!dev) {
      browser.reload();
    }
    done();
  }

  // Sass
  function sass() {

    const sassConfig = {
      includePaths: settings.sass.includePaths,
      outputStyle: dev ? 'nested' : 'compressed',
      sourceMap: dev,
      sourceComments: dev,
      sourceMapEmbed: dev
    };

    return gulp
      .src(settings.sass.files)
      .pipe( gif(dev, sourcemaps.init()) )
      .pipe( nodeSass(sassConfig).on('error', nodeSass.logError) )
      .pipe( gif(dev, sourcemaps.write(undefined, { sourceRoot: null })) )
      .pipe( postcss(postcssList) )
      .pipe( rename({ dirname: '' }) )
      .pipe( gulp.dest(settings.sass.output, { overwrite: true }) )
      .pipe( gif(dev, browser.reload({ stream: true }) ) );

  }

  // Watch for changes to static assets, pages, Sass, and JavaScript
  function watch(done) {

    if (!dev) {
      done();
      return;
    }

    gulp.watch(settings.scripts.files, gulp.series(browserSyncReload));
    gulp.watch(settings.sass.files, sass);

  }

  const taskBuild = gulp.series(clean, gulp.parallel(sass));
  const taskWatch = gulp.series(clean, sass, gulp.parallel(watch, browserSync));

  // export tasks
  return {
    build: taskBuild,
    watch: taskWatch
  };

};
