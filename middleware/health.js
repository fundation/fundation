'use strict';

var debug          = require('debug')('fundation');

module.exports = function(app) {

  debug("Setting up Health Check");

  app.get('/fun_test', function (req, res) {
    res.json({
      status: 'good',
      redis: (app.get('redis').ready === true)
    });
  });

};

