'use strict';

var debug          = require('debug')('fundation:config');
var path           = require('path');
var _              = require('lodash');
var fs             = require('fs');

/**
 * Routes
 */
module.exports = function(app, options) {

  debug("Setting up Config");

  // Config setup
  var config = _.merge({}, options);
  var rootPath = 'config/config.js';
  var overridePath = 'config/' + app.get('env') + '.js';

  // Include the base config
  if (fs.existsSync(rootPath)) {
    config = _.merge(config, require(path.resolve(rootPath)));
  }

  // Include the environment config
  if (fs.existsSync(overridePath)) {
    config = _.merge(config, require(path.resolve(overridePath)));
  }

  // Make this available to Express
  app.set('config', config);

};
