'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:controllers');
var glob           = require("glob");
var path           = require('path');

/**
 * Routes
 *
 * @param {Application} app
 * @api private
 */
module.exports = function(app) {

  debug("Setting up Controllers");

  //
  // Remove the x-powered-by
  //
  app.use(function (req, res, next) {
    res.header("X-powered-by", "Fundation, the fun way to go!");
    next();
  });

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
  glob("controllers/*.js", function (error, files) {
    // Add all of the routes
    files.forEach(function (routePath) {
      // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
      debugRoutes("Route: " + routePath);
      require(path.resolve(routePath))(app);
    });

    // 404 for pages not in the routes
    app.use(function (req, res, next) {
      res.status(404);
      res.render('404.swig');
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

  });

};
