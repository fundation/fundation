'use strict';

var debug          = require('debug')('fundation');
var debugMiddleware = require('debug')('fundation:middleware');
var glob           = require("glob");
var path           = require('path');

module.exports = function(app) {

  debug("Preloading data");

  var files = glob.sync('preload/*.js');
  files.forEach(function (file) {
    debugMiddleware('Preload: ' + file);
    require(path.resolve(file))(app);
  });

};
