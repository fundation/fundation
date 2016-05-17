'use strict';

var debug          = require('debug')('fundation:mysql');
var _              = require('lodash');
var mysql          = require('mysql');

//
// MySQL
//
module.exports = function(app) {

  // Check if there is any configuration for MySQL
  var servers = app.get('config').mysql;
  if ( !servers ) {
    return;
  }

  debug("Setting up MySQL");

  // If "servers" was passed in as a single object
  // convert "servers" to be an array with one object
  if ( servers.constructor !== Array ) {
    var temp = servers;
    servers = Array(temp);
  }

  // Get a connection pool for each server
  var connectionPools = {};
  servers.forEach(function(server){
    connectionPools[server.name] = new MySQL(server);
    debug('MySQL: ' + server.name + ' (' + server.user + '@' + server.host + ':' + server.database + ')');
  });

  // Expose a function to get the connection pool
  app.set('mysql', function (name) {
    return connectionPools[name];
  });

};

//
// Fundation MySQL
//
var MySQL = function(config) {
  var options = _.extend({
    connectionLimit: 10
  }, config);

  this.pool = mysql.createPool(options);

  // Set the error handling once
  this.pool.on('error', function(err) {
    console.log(err);
    connection.release();
  });

  return this;
};

//
//
//
MySQL.prototype.query = function(query){
  var self = this;

  var promise = new Promise(function(resolve, reject) {
    self.pool.getConnection(function(err, connection){
      if (err) {
        connection.release();
        return reject(new Error(err));
      }

      connection.query(query, function(err, rows){
        connection.release();
        if ( err ) {
          return reject(new Error(err));
        } else {
          return resolve(rows);
        }
      });

    }, function(reason){
      return reject(new Error(err));
    });
  });

  return promise;
};

//
//
//
MySQL.prototype.escape = function(string) {
  return mysql.escape(string);
};
