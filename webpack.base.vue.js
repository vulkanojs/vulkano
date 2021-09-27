/*
 *
 * To enable support for VUE, please install the following packages
 *
 * yarn add vue
 * yarn add -D vue-loader vue-template-compiler
 * yarn add -D @vue/cli-plugin-babel @vue/cli-plugin-eslint @vue/cli-service
 */

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
        '@vue/cli-plugin-babel/preset',
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

// Underscore Loader
const useUnderscoreLoader = {
  test: /\.html$/,
  use: {
    loader: 'underscore-template-loader',
    options: {
      engine: 'underscore',
      prependFilenameComment: __dirname,
      evaluate: /{{([\s\S]+?)}}/g,
      interpolate: /{{=([\s\S]+?)}}/g,
      escape: /{{-([\s\S]+?)}}/g
    }
  }
};

// Vue Loader
const useVueLoader = {
  test: /\.vue$/,
  use: {
    loader: 'vue-loader'
  }
};

module.exports = {

  mode: String(process.env.NODE_ENV || 'development').toLowerCase(),

  stats: {
    colors: true,
    env: true
  },

  module: {

    rules: [
      useBabelLoader,
      useESLintLoader,
      useUnderscoreLoader,
      useVueLoader
    ]

  }

};
