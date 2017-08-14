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

  function renderVue (req, res) {
    var s = Date.now()

    // When Vue isn't fully ready
    if ( typeof app.renderer === 'undefined' ) {
      return res.end('...');
    }

    const context = {
      post: req.body,
      cookies: req.cookies,
      config: app.get('config'),
      url: req.url,
     }

    const renderStream = app.renderer.renderToStream(context)
    renderStream.setEncoding('utf8');

    let HTML = ''

    renderStream.on('error', err => {
      if (_.get(err, 'type', '') === 'redirect') {
        return res.redirect(_.get(err, 'code', 301), _.get(err, 'url', ''))
      }

      // all errors should be handled in the view app
      console.error(err)

      if (_.get(err, 'code')) {
        res.status(_.get(err, 'code'))
        return res.end('Error')
      }

      // Generic catchall
      res.status(500).end('Internal Error 500')

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

      HTML = HTML.replace('<!--vue-meta-->', HEAD);
      HTML = HTML.replace('</body>', `<!-- ${moment().format('HH:mm:ss MM/DD/YY')} --></body>`);

      res.end(HTML)
    })
  }

  app.renderVue = renderVue

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
  app.get('*', renderVue)

});
