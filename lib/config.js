'use strict';

var debug          = require('debug')('fundation:config');
var path           = require('path');
var _              = require('lodash');
var fs             = require('fs');

/**
 * Routes
 */
module.exports = function(app) {

  debug("Setting up Config");

  // Config setup
  var config = {}; // _.merge({}, options);
  var rootPath = 'config/config.js';
  var overridePath = 'config/' + app.get('env') + '.js';

  // Include the base config
  if (fs.existsSync(rootPath)) {
    config = _.defaultsDeep(require(path.resolve(rootPath)), config);
  }

  if (fs.existsSync(overridePath)) {
    config = _.mergeWith(config, require(path.resolve(overridePath)), (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return srcValue;
      } else {
        return undefined;
      }
    })
  }

  // Make this available to Express
  app.set('config', config);

};
