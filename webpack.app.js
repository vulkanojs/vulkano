const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const baseConfig = require('./webpack.base');

const env = String(process.env.NODE_ENV || 'development').toLowerCase();

// Define Plugin
const pluginDefinePlugin = new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(env)
});

// ESLint Options
const pluginDefineESLint = new ESLintPlugin({
  failOnWarning: false,
  failOnError: false
});

// Define Plugin Vue
const pluginDefineVue = new VueLoaderPlugin();

const plugins = [
  pluginDefinePlugin,
  pluginDefineESLint,
  pluginDefineVue
];

const config = Object.assign(baseConfig, {
  entry: {
    app: './client/index.js',
    vendors: './client/vendors.js'
  },
  output: {
    path: path.resolve(process.cwd(), './public/'),
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
