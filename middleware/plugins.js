'use strict';

var debug = require('debug')('fundation');
var debugPlugins = require('debug')('fundation:plugins');

module.exports = function(app, plugins, fundation) {

  debug("Setting up Plugins");

  fundation.plugins = {
    controllers: [],
    views: [],
    ui: []
  };

  if ( plugins ) {
    plugins.forEach(function (plugin) {
      debugPlugins('Plugin: ' + plugin.name);

      fundation.plugins.controllers = fundation.plugins.controllers.concat(plugin.controllers);
      fundation.plugins.views = fundation.plugins.views.concat(plugin.views);
      fundation.plugins.ui = fundation.plugins.ui.concat(plugin.ui);
    });
  }

};
