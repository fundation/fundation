'use strict';

var debug = require('debug')('fundation');
var debugPlugins = require('debug')('fundation:plugins');

module.exports = function(app, plugins, fundation) {

  debug("Setting up Plugins");

  if ( plugins ) {
    plugins.forEach(function (plugin) {
      debugPlugins('Plugin: ' + plugin.name);
    });
  }

};
