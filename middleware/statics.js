'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:statics');
var browserify     = require('browserify');
var compression    = require('compression');
var lessMiddleware = require('less-middleware');
var express        = require('express');
var favicon        = require('serve-favicon');
var path           = require('path');
var fs             = require('fs');
var _              = require('lodash');

module.exports = function(app, fundation) {

  debug("Setting up CSS and JS");
  var config = app.get('config').cache;
  var cacheTime = _.get(config, 'staticTime', 300); //time to cache in seconds
  //
  // Compress all requests
  // Adds the following to the "Response Headers"
  //   Content-Encoding: gzip
  //   Transfer-Encoding: chunked
  //   Vary: Accept-Encoding
  //
  app.use(compression());

  var b = browserify();

  //
  // Mashed and compressed JS files!
  //
  var files_combined = [];
  var jsCombinedPath = path.resolve('./public/ui/js/common.js');

  // Make sure that the file "/public/ui/js/common.js" exists
  if (fs.existsSync(jsCombinedPath)) {
    // Get the contents of the file
    var combined = require(jsCombinedPath);

    // Make sure that its a module that was returned
    if (combined) {
      // Todo: Rewrite the code below because it can look cleaner
      // Go through each element that needs to be browserify'ed
      if ( combined.browserify ) {
        for (var i=0; i<combined.browserify.length; i++) {
          if (fs.existsSync(path.resolve('./node_modules/' + combined.browserify[i]))) {
            debug("  Browserifying: " + combined.browserify[i]);
            b.require(combined.browserify[i]);
          } else if (fs.existsSync(path.resolve('./public/ui/js/' + combined.browserify[i]))) {
            debug("  Browserifying: " + combined.browserify[i]);
            var p = path.parse(combined.browserify[i]);
            b.require(path.resolve('./public/ui/js/' + combined.browserify[i]), {
              expose: p.dir + '/' +  p.name
            });
          } else {
            // Todo: Add better error handling when an invalid modules is supplied.
          }
        }
      }
      // Get all of the user defined JavaScript files
      if ( combined.files ) {
        for (var i=0; i<combined.files.length; i++) {
          debug("  Mashing: " + combined.files[i]);
          files_combined.push(path.resolve('./public/ui/js/' + combined.files[i]));
        }
      }
    }
  }

  app.use('/ui/js/common.js', function(req, res, next){
    res.setHeader('Cache-Control', 'public, max-age='+cacheTime);
    res.setHeader('Content-Type', 'text/javascript');
    b.exclude('request');
    b.bundle(function(error, buffer){
      // Send the browerified results first
      if (buffer) {
        res.write(buffer + ';');
      }
      // Now send all of the user defined JavaScript
      files_combined.forEach(function (path, k) {
        var contents = fs.readFileSync(path);
        res.write(contents + ';');
      });
      res.end();
    });
  });

  //
  // Parse our CSS files automatically with LESS
  //   https://github.com/emberfeather/less.js-middleware/wiki/Examples
  //   Load files from /public/ui/less
  //   Output files to /public/ui/css
  //
  var lessOptions = {
    // debug: true,
    dest: path.join('./public/ui/css'),
    // Allow for a global mixins
    preprocess: {
      less: function(src, req) {
        var less = fs.readFileSync(__dirname + '/../less/mixins.less');
        try {
          var preprocess = fs.readFileSync('./public/ui/less/preprocess.less');
          less = less + preprocess;
        } catch(error) { }
        return less + src;
      },
      path: function (lessPath, req) {
        // Check the plugins for *.less files
        for ( var i=0; i<fundation.plugins.public.length; i++ ) {
          var pluginLessPath = fundation.plugins.public[i] + '/ui/less/' + lessPath.replace('public/ui/less/', '');
          if ( fs.existsSync(pluginLessPath) ) {
            return pluginLessPath;
          }
        }

        // Else use the default less location
        return lessPath;
      },
      importPaths: function (lessPath, req) {
        // Make sure @imports work in plugins
        return './public/ui/less/';
      }
    }
  };

  if (app.get('env') !== 'production') {
    lessOptions.render = {
      sourceMap: {
        sourceMapFileInline: true
      }
    };
  }

  app.use('/ui/css', lessMiddleware(path.join('./public/ui/less'), lessOptions));

  //
  // Make it trivial to serve static files
  // http://expressjs.com/guide/using-middleware.html#express.static
  //
  app.use(express.static(path.join('./public'), { maxAge: cacheTime*1000 }));

  // Ability to extend the public folder from the plugins
  for( var i=0; i<fundation.plugins.public.length; i++ ) {
    app.use(express.static(path.join(fundation.plugins.public[i]), { maxAge: cacheTime*1000 }));
  }

  //
  // Load the favicon
  //
  var faviconPath = './public/favicon.ico';
  if (fs.existsSync(faviconPath)) {
    app.use(favicon(faviconPath));
  }

};
