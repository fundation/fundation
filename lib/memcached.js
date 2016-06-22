'use strict';

var debug          = require('debug')('fundation:memcached');
var Memcached      = require('memcached');

module.exports = function(app) {

  // Check if there is any configuration for Memcached
  var servers = app.get('config').memcached;
  if ( !servers ) {
    return;
  }

  debug('Setting up Memcached');

  // Create an instance of memcached
  var memcached = new Memcached(servers);
  debug('Memcached: ' + servers);

  // Make this available to Express
  app.set('memcached', memcached);

};
