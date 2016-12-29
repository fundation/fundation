const path = require('path')
const vueConfig = require('./vue-loader.config')

module.exports = {
  devtool: '#source-map',
  entry: {
    app: path.resolve(__dirname, '../src/client-entry.js'),
    vendor: [
      'es6-promise',
      'vue',
      'vue-router',
      'vuex',
      'vuex-router-sync'
    ]
  },
  performance: false, // Remove this in the future
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[hash].js'
  },
  resolve: { // no clue what this actually does yet
    alias: {
      'public': path.resolve(__dirname, '../public')
    }
  },
  module: {
    noParse: /es6-promise\.js$/, // avoid webpack shimming process
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueConfig
      },
      {
        test: /\.js$/,
        loader: 'buble-loader',
        exclude: /node_modules/,
        options: {
          objectAssign: 'Object.assign'
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      },
      { test: /\.less$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'less-loader'
        ]
      }
    ]
  }
}
