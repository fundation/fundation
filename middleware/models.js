'use strict';

var debug          = require('debug')('fundation');
var debugModels    = require('debug')('fundation:models');
var glob           = require("glob");
var path           = require('path');

module.exports = function(app, fundation) {

  debug("Setting up Models");

  var files = glob.sync('models/*.js');
  files.forEach(function (file) {
    var modelName = path.basename(file, '.js');
    var model = require(path.resolve(file));
    if ( typeof model === 'function' ) {
      debugModels('Model: ' + file);
      fundation.model[modelName] = require(path.resolve(file))(app);
    }
  });

};
