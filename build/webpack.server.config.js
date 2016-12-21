const webpack = require('webpack')
const base = require('./webpack.base.config')
const path = require('path')

module.exports = Object.assign({}, base, {
  target: 'node',
  devtool: false,
  entry: path.resolve(__dirname, '../src/server-entry.js'),
  output: Object.assign({}, base.output, {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs2'
  }),
  resolve: {
    alias: Object.assign({}, base.resolve.alias, {
      'create-api': './create-api-server.js'
    })
  },
  // externals: Object.keys(require('../package.json').dependencies),
  externals: [ Object.keys(require(path.resolve(__dirname, '../../../package.json')).dependencies), { 'browser-request': true } ],
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.VUE_ENV': '"server"'
    })
  ]
})
