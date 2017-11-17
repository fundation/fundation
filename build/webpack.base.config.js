const path = require('path')
const vueConfig = require('./vue-loader.config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const webpack = require('webpack')

const isProdOrStage = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'

module.exports = {
  devtool: isProdOrStage
    ? false
    : '#cheap-module-eval-source-map',
  output: {
    path: path.resolve(__dirname, '../../../dist'),
    publicPath: '/dist/',
    filename: '[name].js?v=[hash]'
  },
  resolve: { // no clue what this actually does yet
    alias: {
      'public': path.resolve(__dirname, '../../../public')
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
        // exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      },
      { test: /\.less$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'less-loader'
        ]
      },
      {
        test: /\.css$/,
        use: isProdOrStage
          ? ExtractTextPlugin.extract({
              use: 'css-loader?minimize',
              fallback: 'vue-style-loader'
            })
          : ['vue-style-loader', 'css-loader']
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      },
    ]
  },
  plugins: isProdOrStage
    ? [
        new webpack.optimize.UglifyJsPlugin({
          compress: { warnings: false }
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new ExtractTextPlugin({
          filename: 'common.css?v=[chunkhash]'
        })
      ]
    : [
        new FriendlyErrorsPlugin()
      ]
}
