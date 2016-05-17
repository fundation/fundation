'use strict';

var debug          = require('debug')('fundation:mongodb');
var _              = require('lodash');
var MongoClient    = require('mongodb').MongoClient;

//
// Mongodb
//
module.exports = function(app) {

  // Check if there is any configuration for Mongodb
  var servers = app.get('config').mongodb;
  if ( !servers ) {
    return;
  }

  debug("Setting up MongoDB");

  // If "servers" was passed in as a single object
  // convert "servers" to be an array with one object
  if ( servers.constructor !== Array ) {
    var temp = servers;
    servers = Array(temp);
  }

  // Get a connection pool for each server
  var connectionPools = {};
  servers.forEach(function(server){
    // Initialize each connection once
    debug('Mongodb: ' + server.name + ' (' + server.host + ':' + server.database + ')');
    MongoClient.connect('mongodb://' + server.host + ':27017/' + server.database + '', function(error, database) {
      if ( error ) {
        debug(error);
        throw error;
      }
      connectionPools[server.name] = database;
    });
  });

  // Expose a function to get the connection pool
  app.set('mongodb', function (name) {
    return connectionPools[name];
  });

};
