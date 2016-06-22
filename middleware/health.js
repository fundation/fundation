'use strict';

var debug          = require('debug')('fundation');

module.exports = function(app) {

  debug("Setting up Health Check");

  app.get('/fun_test', function (req, res) {
    var config = app.get('config');

    var status = 200;
    var redis = false;

    if (config.redis) {
      redis = app.get('redis').ready;
      if ( !redis ) {
        status = 500;
      }
    }

    res.status(status).json({
      env: app.get('env'),
      redis: redis
    });

  });

};
