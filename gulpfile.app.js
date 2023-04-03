const gulpBase = require('./gulp.base');

const port = process.env.PORT || 8000;

// export tasks
const tasks = gulpBase({

  server: {
    proxy: `localhost:${port}`
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
      'src/**/*.scss'
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
