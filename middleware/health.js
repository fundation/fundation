
'use strict';

var debug = require('debug')('fundation');

module.exports = function(app) {
  debug("Setting up Health Check");
  app.get('/health-check', function (req, res) {
    res.status(status).json({
      ok: 1
    })
  })
}
