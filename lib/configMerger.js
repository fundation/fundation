'use strict';

var path           = require('path');
var _              = require('lodash');
var fs             = require('fs');

module.exports = function(env, basePath) {
  var config = {}; // _.merge({}, options);
  const rootPath = `${basePath}config/config.js`;
  const overridePath = `${basePath}config/${env}.js`;

  // Include the base config
  if (fs.existsSync(rootPath)) {
    config = _.merge(config, require(path.resolve(rootPath)));
  }

  // Include the environment config
  if (fs.existsSync(overridePath)) {
    config = _.merge(config, require(path.resolve(overridePath)));
  }

  return config;
}
