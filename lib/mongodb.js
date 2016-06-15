'use strict';

var debug          = require('debug')('fundation:mongodb');
var _              = require('lodash');
var MongoClient    = require('mongodb').MongoClient;

//
// Mongodb
//
module.exports = function(app) {

  return new Promise(function(done){

    // Check if there is any configuration for Mongodb
    var servers = app.get('config').mongodb;
    if ( !servers ) {
      return done();
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
    var promises = [];
    servers.forEach(function(server){
      // Initialize each connection once
      var connection = new Promise(function(resolve, reject){
        debug('Mongodb: ' + server.name + ' (' + server.host + ':' + server.database + ')');
        MongoClient.connect('mongodb://' + server.host + ':27017/' + server.database + '', function(error, database) {
          if ( error ) {
            return reject(error);
          }
          connectionPools[server.name] = database;
          return resolve(database);
        });
      });
      promises.push(connection);
    });

    // Expose a function to get the connection pool
    app.set('mongodb', function (name) {
      return connectionPools[name];
    });

    // Once all of the connections, are finished
    Promise.all(promises)
    .then(function(){
      done();
    });
  });

};
