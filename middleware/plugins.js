'use strict';

var debug = require('debug')('fundation');
var debugPlugins = require('debug')('fundation:plugins');

module.exports = function(app, plugins, fundation) {

  debug("Setting up Plugins");

  fundation.plugins = {
    controllers: [],
    views: [],
    public: [],
    tags: [],
    filters: [],
    models: [],
    middleware: [],
    preload: [],
    tags: [],
    filters: []
  };

  if ( plugins ) {
    plugins.forEach(function (plugin) {
      debugPlugins('Plugin: ' + plugin.name);

      var keys = Object.keys(fundation.plugins);
      for ( var i=0; i<keys.length; i++ ) {
        fundation.plugins[keys[i]] = fundation.plugins[keys[i]].concat(plugin[keys[i]]);
      }
    });
  }

};
