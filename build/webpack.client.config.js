const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./webpack.base.config')
const vueConfig = require('./vue-loader.config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

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
      name: 'vendor',
      minChunks: function (module) {
        // a module is extracted into the vendor chunk if...
        return (
          // it's inside node_modules
          /node_modules\/(?!(lg-*)).*/.test(module.context) &&
          // and not a CSS file (due to extract-text-webpack-plugin limitation)
          !/\.css$/.test(module.request)
        )
      }
    }),
    // extract webpack runtime & manifest to avoid vendor chunk hash changing
    // on every build.
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest'
    }),
    new VueSSRClientPlugin()
  ]
})

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  vueConfig.loaders = {
    less: ExtractTextPlugin.extract({
      use: 'css-loader!less-loader',
      fallback: 'vue-style-loader' // <- this is a dep of vue-loader
    })
  }
}

module.exports = config
