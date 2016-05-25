'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:statics');
var lessMiddleware = require('less-middleware');
var express        = require('express');
var favicon        = require('serve-favicon');
var path           = require('path');
var fs             = require('fs');

module.exports = function(app) {

  debug("Setting up CSS and JS");

  //
  // Mashed and compressed JS files!
  //
  var files_combined = [];

  var jsCombinedPath = path.resolve('./public/ui/js/common.js')
  if (fs.existsSync(jsCombinedPath)) {
    var combined = require(jsCombinedPath);
    if ( combined ) {
      for ( var i=0; i<combined.files.length; i++ ) {
        files_combined.push(path.resolve('./public/ui/js/' + combined.files[i]));
      }
    }
  }

  app.use('/ui/js/common.js', function(req, res, next){
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'text/javascript');

    files_combined.forEach(function (path, k) {
      var contents = fs.readFileSync(path);
      res.write(contents + ';');
    });
    res.end();
  });

  //
  // Parse our CSS files automatically with LESS
  //   https://github.com/emberfeather/less.js-middleware/wiki/Examples
  //   Load files from /public/ui/less
  //   Output files to /public/ui/css
  //
  var lessOptions = {
    // debug: true,
    dest: path.join('./public/ui/css')
  };

  if ( app.get('env') !== 'production' ) {
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
  app.use(express.static(path.join('./public'), { maxAge: '5m' }));

  //
  // Load the favicon
  //
  var faviconPath = './public/favicon.ico';
  if (fs.existsSync(faviconPath)) {
    app.use(favicon(faviconPath));
  }

};
