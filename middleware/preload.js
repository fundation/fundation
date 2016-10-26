'use strict';

var debug          = require('debug')('fundation');
var debugPreload   = require('debug')('fundation:preload');
var glob           = require("glob");
var path           = require('path');

module.exports = function (app, fundation) {

  debug("Preloading data");

  var files = glob.sync('preload/*.js');

  // Add the plugin preloads
  files = files.concat(fundation.plugins.preload);

  files.forEach(function (file) {
    debugPreload('Preload: ' + file);
    require(path.resolve(file))(app, fundation);
  });

};
