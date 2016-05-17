'use strict';

var debug          = require('debug')('fundation');
var debugModels    = require('debug')('fundation:models');
var glob           = require("glob");
var path           = require('path');

module.exports = function(app, fundation) {

  debug("Setting up Models");
  
  var files = glob.sync('models/*.js');
  files.forEach(function (file) {
    debugModels('Model: ' + file);
    var modelName = path.basename(file, '.js');
    fundation.model[modelName] = require(path.resolve(file))(app);
  });

};
