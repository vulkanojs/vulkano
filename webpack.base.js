/* global __dirname */

const path = require('path');

// Babel Loader
const useBabelLoader = {
  test: /\.js$/,
  exclude: /(node_modules)/,
  use: {
    loader: 'babel-loader',
    options: {
      plugins: [
        '@babel/plugin-syntax-jsx',
        '@babel/plugin-syntax-dynamic-import'
      ],
      presets: [
        '@babel/preset-env',
        '@babel/preset-react'
      ]
    }
  }
};

// ESLint Loader
const useESLintLoader = {
  test: /\.js$/,
  enforce: 'pre',
  exclude: /(node_modules)/,
  use: {
    loader: 'eslint-loader',
    options: {
      configFile: path.resolve(__dirname, './.eslintrc'),
      ignore: path.resolve(__dirname, './.eslintignore'),
      failOnWarning: false,
      failOnError: false
    }
  }
};

module.exports = {

  mode: process.env.NODE_ENV || 'development',

  module: {

    rules: [useBabelLoader, useESLintLoader]

  }

};
