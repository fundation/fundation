'use strict';

var debug          = require('debug')('fundation');
var debugRoutes    = require('debug')('fundation:statics');
var async          = require('asyncawait/async');
var await          = require('asyncawait/await');
var babel          = require('babel-core');
var Browserify     = require('browserify');
var checksum       = require('checksum')
var vueify         = require('vueify');
var compression    = require('compression');
var less           = require('less')
var lessMiddleware = require('less-middleware');
var express        = require('express');
var favicon        = require('serve-favicon');
var glob           = require("glob");
var path           = require('path');
var util           = require('util');
var fs             = require('fs');
var _              = require('lodash');
var uglify         = require('uglify-js');

module.exports = function(app, fundation) {

  debug("Setting up CSS and JS");
  var config = app.get('config').cache;

  var browserify = Browserify();
  //time to cache in seconds
  var cacheTime = _.get(config, 'staticTime', 60 * 60 * 24); // 60s * 60m * 24h
  // cache
  var cached = {};
  // checksum - to break cache
  var hashed = {};
  // map of js assets in common.js
  var invertedMap = {};

  // gets mixins and variables needed for less files
  function getLessDependencies (src, req) {

    var originalUrl = req ? _.get(req, 'originalUrl', ''): '/ui/css/common.css'

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

  // gets a compiled and minified common.js
  function getCommonJS (brwsrfy) {
    return new Promise(function(resolve, reject) {
      brwsrfy.exclude('request');
      brwsrfy.transform(vueify);
      brwsrfy.transform("babelify", { presets: ["es2015"] });
      brwsrfy.bundle(function(error, buffer){
        var commonJs = '';

        // Send the browerified results first
        if (buffer) {
          commonJs += buffer.toString('utf-8');
        }

        // build common.js
        files_combined.forEach(function (path, k) {
          commonJs += babel.transformFileSync(path, { presets: ["es2015"] }).code;
        });

        // uglify
        resolve(uglify.minify(commonJs, {fromString: true}).code);
      });
    });
  }

  //
  // Compress all requests
  // Adds the following to the "Response Headers"
  //   Content-Encoding: gzip
  //   Transfer-Encoding: chunked
  //   Vary: Accept-Encoding
  //
  app.use(compression());

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
              browserify.require(combined.browserify[i]);
            } else if (fs.existsSync(path.resolve('./public/ui/js/' + combined.browserify[i]))) {
              debug("  Browserifying: " + combined.browserify[i]);
              var p = path.parse(combined.browserify[i]);
              browserify.require(path.resolve('./public/ui/js/' + combined.browserify[i]), {
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
            invertedMap['/ui/js/' + combined.files[i]] = true;
          }
        }
      }
    }
  }

  // VERSION CSS on prod and staging
  if (app.get('env') !== 'development') {
    //
    // JS
    // cached normal js files

    // loops through each file in public/ui/js and puts it into cached and hashed map
    glob(path.resolve('./public/ui/js') + '/*.js', async (function (error, files) {
      files.forEach(function (file_path) {
        if (fs.existsSync(file_path)) {

          // replaces [/everything/before/public]/ui/js/file.js
          var url = file_path.replace(/.*?(\/ui\/js\/.*.js)$/gi, '$1');

          if (url === '/ui/js/common.js') {
            return;
          } else if (invertedMap[url]) {
            return;
          }

          cached[url] = uglify.minify(babel.transformFileSync(file_path, { presets: ["es2015"] }).code, {fromString: true}).code;
          hashed[url] = checksum(cached[url])
        }
      })
    }));

    try {
    // compile common.js
      cached['/ui/js/common.js'] = await ( getCommonJS(browserify) )
      hashed['/ui/js/common.js'] = checksum(cached['/ui/js/common.js'])
    } catch (err) {
      // uh oh!
    }

    // LESS
    // compile common.less

    var compiledCss = '';
    var commonLessFilePath = path.resolve('./public/ui/less/common.less');

    if (fs.existsSync(commonLessFilePath)) {
      var commonLess = fs.readFileSync(commonLessFilePath);
      var lessOption = {
        paths: [process.cwd() + '/public/ui/less'],
        compress: true
      }

      try {
        compiledCss = await (less.render(getLessDependencies('', undefined) + commonLess, lessOption))
      } catch (err) {
        // handle error
      }
    }

    // place css and checksum
    cached['/ui/css/common.css'] = compiledCss.css;
    hashed['/ui/css/common.css'] = checksum(compiledCss.css);
  }


  app.use('/ui/js/common.js', function(req, res, next){
    res.setHeader('Cache-Control', 'public, max-age='+cacheTime);
    res.setHeader('Content-Type', 'text/javascript');

    // Using memory cache in production
    // app.get('env') !== 'development' &&
    if ( cached['/ui/js/common.js'] ) {
      res.write(cached['/ui/js/common.js'] + ';');
      res.end();
    } else {
      getCommonJS(browserify)
      .then(function(response) {
        cached['/ui/js/common.js'] = response;
        res.write(cached['/ui/js/common.js'] + ';')
        res.end();
      })
      .catch(function(err) {
        next();
      })
    }
  });

  // Browserify individual JS files
  app.use('*.js', function(req, res, next){
    if ( cached[req.baseUrl] ) {
      res.write(cached[req.baseUrl] + ';');
      res.end();
    } else {

      cached[req.baseUrl] = '';
      var file_path = 'public' + req.baseUrl;
      if (fs.existsSync(file_path)) {
        cached[req.baseUrl] = uglify.minify(babel.transformFileSync(file_path, { presets: ["es2015"] }).code, {fromString: true}).code;

        res.write(cached[req.baseUrl] + ';');
        return res.end();
      }

      next();
    }
  });

  // Browserify individual JS files
  // app.use('*.vue', function(req, res, next){

  //   var file_path = 'public' + req.baseUrl;
  //   if (fs.existsSync(file_path)) {

  //     browserify(file_path)
  //     .transform(vueify)
  //     .bundle(function(error, buffer){
  //       if ( error ) {
  //         console.log(error);
  //         next(404);
  //       } else {
  //         console.log("I did it")
  //         res.write(buffer.toString('utf-8') + ';');
  //         return res.end();
  //       }
  //     })
  //   } else {
  //     next(404);
  //   }
  // });

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
      less: getLessDependencies
    }
  };

  if (app.get('env') !== 'production') {
    lessOptions.render = {
      sourceMap: {
        sourceMapFileInline: true
      }
    };
  }

  app.use('/ui/css/common.css', function (req, res, next) {
    if (cached['/ui/css/common.css']) {
      res.setHeader('Cache-Control', 'public, max-age='+cacheTime);
      res.setHeader('Content-Type', 'text/css');
      res.write(cached['/ui/css/common.css']);
      res.end();
    } else {
      next();
    }
  })

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

  app.set('hashed', hashed);
};
