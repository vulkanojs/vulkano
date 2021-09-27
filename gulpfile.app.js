const gulpBase = require('./gulp.base');

// export tasks
const tasks = gulpBase({

  server: {
    proxy: 'localhost:5000'
  },

  scripts: {
    files: [
      'public/**/*.js',
      'app/views/**/*.html',
      'app/views/**/*.njk'
    ]
  },

  sass: {
    files: [
      'client/scss/**/*.scss'
    ],
    includePaths: [
      './',
      './node_modules/foundation-sites/scss',
      './node_modules/@mdi/font/scss',
      './node_modules/aos/src/sass'
    ],
    output: './public/css'
  }

});

exports.build = tasks.build;
exports.default = tasks.watch;
exports.watch = tasks.watch;
