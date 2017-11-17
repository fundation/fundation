'use strict';

const _ = require('lodash')
const debug = require('debug')('fundation')
const debugMiddleware = require('debug')('fundation:middleware')
const express = require('express')
const compression = require('compression')
const path = require('path')
const resolve = file => path.resolve(__dirname, file)

const isProdOrStage = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'

// 60 * 60 * 24 * 30 = 30 days.
const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProdOrStage ? 60 * 60 * 24 * 30 : 0
})

module.exports = function(app, fundation) {

  debug("Setting up Static Assets")

  let config = app.get('config').cache;
  let cacheTime = _.get(config, 'staticTime', 300); //time to cache in seconds

  // https://github.com/expressjs/compression
  app.use(compression({ threshold: 6 }))

  // Used for production builds
  app.use('/dist', serve('../../../dist'))

  // Service static assets
  app.use('/', serve('../../../public'))

}
