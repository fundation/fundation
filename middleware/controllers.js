'use strict';

const _ = require('lodash')
const debug = require('debug')('fundation')
const debugRoutes = require('debug')('fundation:controllers')
const fs = require('fs')
const glob = require("glob")
const path = require('path')
const serialize = require('serialize-javascript')
const moment = require('moment')
const express = require('express')
const pump = require('pump')
const streamBuffers = require('stream-buffers')

/**
 * Routes
 *
 * @param {Application} app
 * @api private
 */
module.exports = async function(app, fundation) {

  debug("Setting up Controllers");

  //
  // Enable case sensitivity
  // "/Foo" and "/foo" will be treated as seperate routes
  //
  app.set('case sensitive routing', true);

  // Example: app.r.get('/test', function (req, res, next) {
  // app.r = express.Router({
  //   strict: true,
  //   caseSensitive: true
  // });

  // app.use(app.r);
  //

  function renderVue (req, res, next) {
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
      initialSize: (60 * 1024),   // start at 60 kilobytes.
      incrementAmount: (10 * 1024) // grow by 10 kilobytes each time buffer overflows.
    })

    // When Vue isn't fully ready
    if ( typeof app.renderer === 'undefined' ) {
      return res.end('...');
    }

    const context = { url: req.url, cookies: req.cookies, config: app.get('config') }
    const renderStream = app.renderer.renderToStream(context)
    renderStream.setEncoding('utf8');

    pump(renderStream, writableStreamBuffer, function end (error) {
      // error handling
      if (error) {
        // if a redirect, redirect and return
        if (_.get(error, 'type', '') === 'redirect') {
          return res.redirect(_.get(error, 'code', 301), _.get(error, 'url', ''))
        }

        console.error(error)

        // log error
        if (error && _.get(app, 'handleErrors.stream', false)) {
          app.handleErrors.stream(error)
        }

        // other custom 5xx error codes
        if (_.get(error, 'code')) {
          res.status(_.get(error, 'code'))
          return res.end('Error')
        }

        // return generic error
        return res.status(500).end('Internal Error 500')
      }

      const m = context.meta.inject()
      const  HEAD = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text()
      let HTML = writableStreamBuffer.getContentsAsString('utf8')
      HTML = HTML.replace('<!--vue-meta-->', HEAD);

      res.status(_.get(context, 'state.statusCode', 200))
      res.send(HTML.replace('</body>', `<!-- ${moment().format('HH:mm:ss MM/DD/YY')} --></body>`))
    })
  }

  app.renderVue = renderVue

  //
  // Add routes to express
  //
  glob("controllers/*.js", function (error, files) {
    // Add all of the routes
    files.forEach(async function (routePath) {
      if ( routePath === 'controllers/before.js' || routePath === 'controllers/after.js' ) {
        return;
      }
      // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
      debugRoutes("Route: " + routePath);
      await (require(path.resolve(routePath))(app, fundation));
    });
  })

  //
  // Add in a route for Vue
  //
  app.get('*', renderVue)
}
