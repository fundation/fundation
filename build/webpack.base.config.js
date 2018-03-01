const _ = require('lodash')
const path = require('path')
const vueConfig = require('./vue-loader.config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const webpack = require('webpack')
const configMerger = require('../lib/configMerger')
const S3Plugin = require('webpack-s3-plugin')

const isProdOrStage = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
const rootPath = path.resolve(__dirname, '../../../')
const config = configMerger(process.env.NODE_ENV, rootPath + '/')

const plugins = isProdOrStage ? [
  new webpack.optimize.UglifyJsPlugin({
    compress: { warnings: false }
  }),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new ExtractTextPlugin({
    filename: 'common_[chunkhash].css'
  }),
  new S3Plugin({
    include: /.*\.(css|js)/,
    // s3Options are required
    s3Options: {
      accessKeyId: process.env.S3_ACCESS,
      secretAccessKey: process.env.S3_SECRET,
      region: 'us-east-1'
    },
    s3UploadOptions: {
      Bucket: _.get(config, 's3.bucket', ''),
    },
    basePath: 'assets'
    // cdnizerOptions: {
    //   defaultCDNBase: 'http://asdf.ca'
    // }
  })
] : [
  new FriendlyErrorsPlugin()
]

module.exports = {
  devtool: isProdOrStage
    ? false
    : '#cheap-module-eval-source-map',
  output: {
    path: path.resolve(rootPath + '/dist'),
    publicPath: '/dist/',
    filename: '[name]_[hash].js'
  },
  resolve: { // no clue what this actually does yet
    alias: {
      'public': path.resolve(rootPath + '/public')
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
  plugins: plugins
}
