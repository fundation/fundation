'use strict';

var debug          = require('debug')('fundation');
var auth           = require('basic-auth');

//
// Example Config:
// 
// basicAuth: {
//   username: "bigbird",
//   password: "opensesame"
// }
//
module.exports = function(app) {

  // Don't use basic auth if its not enabled
  var basicAuth = app.get('config').basicAuth;
  if ( !basicAuth || !basicAuth.username || !basicAuth.password ) {
    return;
  }

  // Allow for enviornment restriction
  if ( basicAuth.environment && 
       basicAuth.environment.constructor === Array && 
       basicAuth.environment.indexOf(app.get('env')) === -1 ) {
    return;
  }

  debug("Setting up Basic Auth");

  // Load in the middleware
  app.use(function (req, res, next) {
    var user = auth(req);
    if ( user === undefined ||
       user.name !== basicAuth.username ||
       user.pass !== basicAuth.password) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="Website"');
      res.end('Unauthorized');
    } else {
      next();
    }
  });

};