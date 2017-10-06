const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const gulp = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const gif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const browser = require('browser-sync');

module.exports = function (settings) {

  const dev = process.env.NODE_ENV !== 'production';
  const postcssList = [
    autoprefixer({
      browsers: [
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
  gulp.task('clean', function (done) {
    done();
  });

  // Start a server with BrowserSync to preview the site in
  gulp.task('server', function (done) {
    if (dev) {
      browser.init(settings.server);
    }
    done();
  });

  // Reload the browser with BrowserSync
  gulp.task('reload', function (done) {
    if (dev) {
      browser.reload();
    }
    done();
  });


  gulp.task('sass', function () {

    let sassConfig = {
      includePaths: settings.sass.includePaths,
      outputStyle: dev ? 'nested' : 'compressed',
      sourceMap: dev,
      sourceComments: dev,
      sourceMapEmbed: dev
    };

    return gulp.
      src(settings.sass.files).
      pipe( gif(dev, sourcemaps.init()) ).
      pipe(
        sass(sassConfig).
        on('error', sass.logError)
      ).
      pipe( gif(dev, sourcemaps.write(undefined, { sourceRoot: null })) ).
      pipe( postcss(postcssList) ).
      pipe( rename({ dirname: '' }) ).
      pipe( gulp.dest(settings.sass.output, { overwrite: true }) ).
      pipe( gif(dev, browser.reload({ stream: true })) );

  });

  // Watch for changes to static assets, pages, Sass, and JavaScript
  gulp.task('watch', function () {

    if (!dev) {
      return;
    }
    gulp.watch(settings.sass.files, ['sass']);
    gulp.watch(settings.scripts.files).on('change', browser.reload);

  });

  gulp.task('default', ['clean', 'server', 'sass', 'watch']);
};
