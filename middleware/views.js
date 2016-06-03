'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:views');
var minify         = require('html-minifier').minify;
var glob           = require("glob");
var path           = require('path');
var swig           = require('swig');
var _              = require('lodash');

/**
 * Views
 *
 * @param {Application} app
 * @api private
 */
module.exports = function(app) {

  debug("Setting up Views");

  //
  // Set the "views" folder to containe our views
  //
  app.set('view engine', 'html');
  app.set('views', path.join('./views'));

  //
  // Disable cache on dev
  //
  app.set('view cache', false);
  swig.setDefaults({
    cache: false
  });

  //
  // Include custom tags
  //
  var tags = {};
  glob("tags/*.js", function (error, files) {
    files.forEach(function(routePath) {
      var tagName = path.basename(routePath, '.js');
      tags[tagName] = require(path.resolve(routePath))(app);
      swig.setTag(tagName, tags[tagName].parse, tags[tagName].compile, tags[tagName].ends, tags[tagName].block);
    });
  });

  //
  // Include custom filters
  //
  glob("filters/*.js", function (error, files) {
    files.forEach(function(routePath) {
      var filterName = path.basename(routePath, '.js');
      var filter = require(path.resolve(routePath));
      swig.setFilter(filterName, filter);
    });
  });

  //
  // Intercept the render function
  // Save original render
  // Resolve all promises
  // Call original render
  //
  var response = app.response;
  // var _render = response.render;
  var _json = response.json;

  response._render = function() {
    var self = this;
    var selfArguments = arguments;
    selfArguments[1] = _.merge({}, this.req.commonLocals, selfArguments[1]);

    waitForPromises(selfArguments[1])
    .then(function (locals) {
      self.render.apply( self, selfArguments );
    }, function (error) {
      self.status(404);
      self.render('404.swig');
    });
  };

  response.json = function( ) {
    var self = this;
    var selfArguments = arguments;
    selfArguments[1] = _.merge({},this.req.commonLocals, selfArguments[1]);

    waitForPromises(selfArguments[0])
    .then(function(locals){
      _json.apply( self, selfArguments );
    });
  };

  function waitForPromises(locals) {
    // Find all of the promises
    var keys = [];
    var promises = [];
    for (var key in locals) {
      if ( locals[key] && typeof locals[key].then === 'function' ) {
        keys.push(key);
        promises.push(locals[key]);
      }
    }

    // Wait for the promises to finish
    return new Promise(function(resolve, reject) {
      Promise.all(promises)
      .then(function (results) {
        for ( var i=0; i<results.length; i++ ) {
          locals[keys[i]] = results[i];
        }
        resolve(locals);
      }, function (error){
        reject(error);
      });
    });
  }

  //
  // Setup master layout
  //
  app.engine('swig', function ( pathName, locals, callback ) {
    // Render the template first
    swig.renderFile( pathName, locals, function ( error, html ) {

      // Give me a hint if something isn't working.
      if ( error ) {
        debug("Template Error: " + path.basename(pathName));
        debug("  " + error);
      }

      // get the layout file
      if ( typeof locals.layout === 'undefined' ) {
        locals.layout = 'default.swig';
      }

      locals.html = html;

      var outputHTML = swig.renderFile(app.get('views') + '/layouts/' + locals.layout, locals);

      // Auto minify the HTML
      outputHTML = minify(outputHTML, {
        removeComments: true,
        collapseWhitespace: true
      });

      // Render the layout page and insert the HTML
      // Along with the new locals that is inherited
      callback(null, outputHTML);
    });
  });
};
