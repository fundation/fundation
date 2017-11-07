const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./webpack.base.config')
const vueConfig = require('./vue-loader.config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

const config = merge(base, {
  entry: __dirname + '/../src/entry-client.js',
  resolve: {
    alias: {
      'create-api': './create-api-client.js'
    }
  },
  externals: [{
    request: true,
    newrelic: 'NewRelic'
  }],
  plugins: [
    // strip dev-only code in Vue source
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.VUE_ENV': '"client"'
    }),
    // extract vendor chunks for better caching
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'
    }),
    new VueSSRClientPlugin()
  ]
})

if (process.env.NODE_ENV === 'production') {
  vueConfig.loaders = {
    less: ExtractTextPlugin.extract({
      use: 'css-loader!less-loader',
      fallback: 'vue-style-loader' // <- this is a dep of vue-loader
    })
  }
  config.plugins.push(
    // minify JS
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //   }
    // }),
    new ExtractTextPlugin('styles.css?v=[hash]'),
    // this is needed in webpack 2 for minifying CSS
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

module.exports = config
