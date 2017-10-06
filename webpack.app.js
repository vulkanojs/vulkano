const path = require('path');
const webpack = require('webpack');
const baseConfig = require('./webpack.base');
const dev = process.env.NODE_ENV !== 'production';

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production')
  })
];

if (!dev) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false }
    })
  );
}

module.exports = Object.assign(baseConfig, {
  entry: {
    'app': './client/js/index.js'
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
  devtool: dev ? 'source-map' : undefined,
  plugins
});
