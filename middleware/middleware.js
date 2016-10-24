'use strict';

var debug          = require('debug')('fundation');
var debugMiddleware = require('debug')('fundation:middleware');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var glob           = require("glob");
var path           = require('path');

module.exports = function(app, fundation) {

  debug("Setting up Middleware");

  //
  // Parse data that is submitted from a <form>
  // console.log(__dirname + '/../uploads');
  //
  app.use(bodyParser.json()); // For parsing application/json
  app.use(bodyParser.urlencoded({
    extended: true // For parsing application/x-www-form-urlencoded
  }));

  app.use(function(req, res, next){
    res.locals.currentURL = req.url;
    next();
  });

  //
  // Support for cookies
  //
  app.use(cookieParser());

  var files = glob.sync('middleware/*.js');

  // Add the plugin middlewares
  files = files.concat(fundation.plugins.middleware);

  files.forEach(function (file) {
    debugMiddleware('Middleware: ' + file);
    require(path.resolve(file))(app);
  });

};
