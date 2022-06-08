const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const pk = require('./package.json');
const baseConfig = require('./webpack.base');

const env = String(process.env.NODE_ENV || 'development').toLowerCase();
const version = String(pk.version) || '0.0.1';

const pluginEnvironment = new webpack.EnvironmentPlugin({
  NODE_ENV: env,
  VERSION: version
});

// ESLint Options
const pluginDefineESLint = new ESLintPlugin({
  failOnWarning: false,
  failOnError: false
});

// Define Plugin Vue
const pluginDefineVue = new VueLoaderPlugin();

const plugins = [
  pluginEnvironment,
  pluginDefineESLint,
  pluginDefineVue
];

const config = Object.assign(baseConfig, {
  entry: {
    app: './client/index.js'
  },
  output: {
    path: path.resolve(process.cwd(), './default/public/'),
    filename: 'js/[name].js'
  },
  resolve: {
    modules: [
      './',
      './node_modules/'
    ]
  },
  devtool: env !== 'production' ? 'source-map' : undefined,
  plugins
});

module.exports = config;
