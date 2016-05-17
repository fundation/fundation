'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:logging');
var morgan         = require('morgan');

module.exports = function(app) {

  debug("Setting up Logging");

  //
  // It is important to keep logging first
  //
  // If on dev, just show the logs on the console
  // If anywhere else write the logs to a file.
  //
  if ( false ) {
    // Store the logs to a file.
    var logDirectory = __dirname + '/../logs';
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

    // create a rotating write stream 
    var accessLogStream = FileStreamRotator.getStream({
      filename: logDirectory + '/access-%DATE%.log',
      frequency: 'daily',
      verbose: false
    });

    app.use(morgan('combined', { stream: accessLogStream }));
  } else {
    app.use(morgan('dev'));
  }

};

