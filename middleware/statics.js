'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:statics');
var browserify     = require('browserify');
var compression    = require('compression');
var lessMiddleware = require('less-middleware');
var express        = require('express');
var favicon        = require('serve-favicon');
var path           = require('path');
var util           = require('util');
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

  // collect all common.js files from site and plugins
  var commonFiles = [];
  commonFiles.push(path.resolve('./public/ui/js/common.js'));

  // append all plugins and make path to common.js
  for (var i=0; i<fundation.plugins.public.length; i++) {
    commonFiles.push(fundation.plugins.public[i] + '/ui/js/common.js');
  }

  for (var j=0; j<commonFiles.length; j++) {
    var jsCombinedPath = commonFiles[j];

    // Make sure that the common.js file exists
    if (fs.existsSync(jsCombinedPath)) {

      // Get the contents of the file
      var combined = require(jsCombinedPath);

      // Make sure that its a module that was returned
      if (combined) {

        // Todo: Rewrite the code below because it can look cleaner
        // Go through each element that needs to be browserify'ed
        if (combined.browserify) {
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

        // Get all of the user/module defined JavaScript files
        if (combined.files) {
          var jsDirectory = path.dirname(jsCombinedPath);

          for (var i=0; i<combined.files.length; i++) {
            debug("  Mashing: " + combined.files[i]);
            files_combined.push(jsDirectory + '/' + combined.files[i]);
          }
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
    preprocess: {
      less: function(src, req) {
        var originalUrl = _.get(req, 'originalUrl', '');
        var less = '';
        var siteRoot = process.cwd();

        // import variables and mixins every time, regardless of the file requested
        var lessFilenames = [
          'variables',
          'mixins'
        ];

        lessFilenames.forEach(function (filename) {

          // load all the plugin files if they exist
          fundation.plugins.public.forEach(function (pluginPublicPath) {
            var pluginFile = pluginPublicPath + '/ui/less/' + filename + '.less';

            if (fs.existsSync(pluginFile)) {
              less += fs.readFileSync(pluginFile);
            }
          });

          // load the site file if it exists
          var siteFile = siteRoot + '/public/ui/less/' + filename + '.less';

          if (fs.existsSync(siteFile)) {
            less += fs.readFileSync(siteFile);
          }
        });

        if (originalUrl == '/ui/css/common.css') {

          // load all commmon files following stage precedence
          var lessFilenames = [
            'common.stage1',
            'common.stage2',
            'common.stage3',
            'common'
          ];

          lessFilenames.forEach(function (filename) {

            // load all the plugin files if they exist
            fundation.plugins.public.forEach(function (pluginPublicPath) {
              var pluginFile = pluginPublicPath + '/ui/less/' + filename + '.less';

              if (fs.existsSync(pluginFile)) {
                less += fs.readFileSync(pluginFile);
              }
            });

            // load the site file if it exists unless the filename is 'common'
            // because it is added in the return statement via 'src'
            var siteFile = siteRoot + '/public/ui/less/' + filename + '.less';

            if (fs.existsSync(siteFile) && filename != 'common') {
              less += fs.readFileSync(siteFile);
            }
          });

        } else {

          // load a specific css file (ie: /ui/css/pages/about.css)
          fundation.plugins.public.forEach(function (pluginPublicPath) {
            var lessPath = (pluginPublicPath + originalUrl)
              .replace('.css', '.less')
              .replace('/css/', '/less/');

            if (fs.existsSync(lessPath)) {
              less += fs.readFileSync(lessPath);
            }
          });

        }

        return less + src;
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
