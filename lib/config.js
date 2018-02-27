'use strict';

var debug          = require('debug')('fundation:config');
var path           = require('path');
var _              = require('lodash');
var fs             = require('fs');
var configMerger         = require('./configMerger.js')

module.exports = function(app) {

  debug("Setting up Config");

  const config = configMerger(app.get('env'), '');

  // Make this available to Express
  app.set('config', config);

};
