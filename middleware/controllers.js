'use strict';

const _ = require('lodash')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const debug = require('debug')('fundation')
const debugRoutes = require('debug')('fundation:controllers')
const fs = require('fs')
const glob = require("glob")
const path = require('path')
const serialize = require('serialize-javascript')
const moment = require('moment')
var express = require('express')

/**
 * Routes
 *
 * @param {Application} app
 * @api private
 */
module.exports = async (function(app, fundation) {

  debug("Setting up Controllers");

  //
  // Enable case sensitivity
  // "/Foo" and "/foo" will be treated as seperate routes
  //
  app.set('case sensitive routing', true);

  // Example: app.r.get('/test', function (req, res, next) {
  app.r = express.Router({
    strict: true,
    caseSensitive: true
  });

  app.use(app.r);

  //
  // Add routes to express
  //
  await (glob("controllers/*.js", function (error, files) {
    // Add all of the routes
    files.forEach(async (function (routePath) {
      if ( routePath === 'controllers/before.js' || routePath === 'controllers/after.js' ) {
        return;
      }
      // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
      debugRoutes("Route: " + routePath);
      await (require(path.resolve(routePath))(app, fundation));
    }));
  }));

  //
  // Add in a route for Vue
  //
  app.get('*', (req, res) => {
    var s = Date.now()

    // When Vue isn't fully ready
    if ( typeof app.renderer === 'undefined' ) {
      return res.end('...');
    }

    const context = { url: req.url, cookies: req.cookies, config: app.get('config') }
    const renderStream = app.renderer.renderToStream(context)
    renderStream.setEncoding('utf8');

    let HTML = ''

    renderStream.on('error', err => {
      // the vue app should handle all 404's
      if (err && err.code === '404') {
        res.status(404).end('404 | Page Not Found')
        console.log(`${req.method} ${req.url} 404 ${Date.now() - s} ms`)
        return
      } else if (err && err.code === '301') {
        // handle 301 redirects
        res.redirect(301, err.url)
        return
      }
      // Render Error Page
      res.status(500).end('Internal Error 500')
      console.log(`${req.method} ${req.url} 500 ${Date.now() - s} ms`)
      console.error(err)
    })

    // Build the HTML for the page
    renderStream.on('data', chunk => {
      HTML += chunk;
    })

    // Done with the HTML, add in vue-meta and a time stamp
    renderStream.on('end', () => {
      res.setHeader("Content-Type", "text/html");
      res.status(_.get(context, 'state.statusCode', 200))

      // Create a string for vue-meta
      const m = context.meta.inject()
      let HEAD = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text()

      HEAD = HEAD.replace(/ data-vue-meta="true"/g, '')
      HTML = HTML.replace('<!--vue-meta-->', HEAD);
      HTML = HTML.replace('</body>', `<!-- ${require('os').hostname()} ${moment().format('HH:mm:ss MM/DD/YY')} --></body>`);

      res.end(HTML)
    })
  });

});
