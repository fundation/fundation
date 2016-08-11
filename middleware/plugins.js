'use strict';

var debug          = require('debug')('fundation');
var debugPlugins    = require('debug')('fundation:plugins');

module.exports = function(app, plugins, fundation) {

  debug("Setting up Plugins");

  plugins.forEach(function (plugin) {
    if( typeof plugin === 'function' ) {
      debugPlugins('Plugin: ' + plugin.name);
      app.use(plugin(fundation));
    }
  });

};
