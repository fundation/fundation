'use strict';

var debug          = require('debug')('fundation:redis');
var Redis          = require('ioredis');

//
// Redis
//
module.exports = function(app) {

  // Check if there is any configuration for Redis
  var server = app.get('config').redis;
  if ( !server ) {
    return;
  }

  return new Promise(function(resolve, reject) {

    debug('Setting up Redis');

    var client = new Redis({
      sentinels: [
        {
          host: server.host,
          port: server.port
        }
      ],
      name: server.name
    });

    client.on('error', function(err) {
      console.error('Redis error: ' + err);

      app.set('redis', false);

      resolve(true);
    });

    client.on('ready', function(err) {
      app.set('redis', client);

      resolve(true);
    });
  });

};
