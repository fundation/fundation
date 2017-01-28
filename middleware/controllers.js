'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:controllers');
var glob           = require("glob");
var path           = require('path');
var async          = require('asyncawait/async');
var await          = require('asyncawait/await');

/**
 * Routes
 *
 * @param {Application} app
 * @api private
 */
module.exports = function(app, fundation) {

  debug("Setting up Controllers");

  //
  // Enable case sensitivity
  // "/Foo" and "/foo" will be treated as seperate routes
  //
  app.set('case sensitive routing', true);

  //
  // Enable strict routing,
  // "/foo" and "/foo/" will be treated as seperate routes
  //
  app.set('strict routing', true);

  // Read the routes folder
  glob("controllers/*.js", async (function (error, files) {
    // Add the plugin routes
    files = files.concat(fundation.plugins.controllers);

    // Add all of the routes
    files.forEach(function (routePath) {
      // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
      debugRoutes("Route: " + routePath);
      await (require(path.resolve(routePath))(app, fundation));
    });

    // 404 for pages not in the routes
    app.use(function (req, res, next) {
      var error = fundation.model["404"];
      var locals = error && typeof error.locals === 'function' ? error.locals() : {};

      res.status(404);
      res.render('404.swig', locals);
    });

    // http://expressjs.com/starter/faq.html#how-do-you-setup-an-error-handler
    app.use(function (error, req, res, next) {
      // output errors
      debug(error);

      switch(error.status) {
        case 400:
          res.status(400);
          res.render('404.swig');
          break;
        case 404:
          res.status(404);
          res.render('404.swig');
          break;
        default:
          res.status(500);
          res.render('500.swig', {
            error: ( app.get('env') === 'production' ) ? '' : error.stack,
            layout: "blank.swig"
          });
      }
    });

  }));

};
