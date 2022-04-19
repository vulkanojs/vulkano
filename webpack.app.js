const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

const baseConfig = require('./webpack.base');

const env = String(process.env.NODE_ENV || 'development').toLowerCase();

// Define Plugin
const pluginDefinePlugin = new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(env)
});

// ESLint Options
const ESLitOptions = {
  failOnWarning: false,
  failOnError: false
};

const plugins = [
  pluginDefinePlugin,
  new ESLintPlugin(ESLitOptions)
];

const config = Object.assign(baseConfig, {
  entry: {
    app: './client/js/index.js',
    vendors: './client/js/vendors.js'
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
