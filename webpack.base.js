/* global __dirname */

const path = require('path');

module.exports = {
  module: {
    rules: [{
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            'env',
            'stage-1'
          ]
        }
      },
      test: /\.js$/,
      exclude: /(node_modules)/
    },
    {
      use: {
        loader: 'eslint-loader',
        options: {
          configFile: path.resolve(__dirname, './.eslintrc'),
          ignore: path.resolve(__dirname, './.eslintignore'),
          failOnWarning: false,
          failOnError: false
        }
      },
      test: /\.js$/,
      enforce: 'pre',
      exclude: /(node_modules)/
    }]
  }
};
