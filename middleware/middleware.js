'use strict';

const debug = require('debug')('fundation')
const debugMiddleware = require('debug')('fundation:middleware')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const glob = require("glob")
const morgan = require('morgan')
const path = require('path')

module.exports = function(app, fundation) {

  debug("Setting up Middleware")

  //
  // Set up logging
  //
  const morgan_env = (app.get('env') === 'production') ? 'combined' : 'dev'
  app.use(morgan(morgan_env))

  //
  // Parse data that is submitted from a <form>
  // console.log(__dirname + '/../uploads')
  //
  app.use(bodyParser.json()) // For parsing application/json
  app.use(bodyParser.urlencoded({
    extended: true // For parsing application/x-www-form-urlencoded
  }))

  //
  // Support for cookies
  //
  app.use(cookieParser())

  // Add the plugin middlewares
  let files = glob.sync('middleware/*.js')
  files.forEach(function (file) {
    debugMiddleware('Middleware: ' + file)
    require(path.resolve(file))(app)
  })

}
