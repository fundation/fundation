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

  //
  // Add routes to express
  //
  glob("controllers/*.js", async (function (error, files) {

    // Add all of the routes
    files.forEach(function (routePath) {
      if ( routePath === 'controllers/before.js' || routePath === 'controllers/after.js' ) {
        return;
      }
      // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
      debugRoutes("Route: " + routePath);
      await (require(path.resolve(routePath))(app, fundation));
    });

  }));

  //
  // Add in a route for Vue
  //
  app.get('*', (req, res) => {
    res.setHeader("Content-Type", "text/html");
    var s = Date.now()
    const context = { url: req.url, cookies: req.cookies }
    const renderStream = app.renderer.renderToStream(context)

    renderStream.once('data', () => {

      const {
        title, htmlAttrs, bodyAttrs, link, style, script, noscript, meta
      } = context.meta.inject()

      res.status(_.get(context, 'initialState.code', 200))

      res.write(app.baseHTML[0])

      res.write(meta.text())
      res.write(title.text())
      res.write(link.text())
      res.write(style.text())
      res.write(script.text())
      res.write(noscript.text())

      res.write(app.baseHTML[1])
    })

    renderStream.on('data', chunk => {
      res.write(chunk)
    })

    renderStream.on('end', () => {
      // Embed initial store state
      if (context.initialState) {
        res.write(
          `<script>window.__INITIAL_STATE__=${
            serialize(context.initialState, { isJSON: true })
          }</script>`
        )
      }

      const currentDate = `<!-- ${moment().format('HH:mm:ss MM/DD/YY')} -->`

      res.end(`${app.baseHTML[2]}\n${currentDate}`)

      console.log(`${req.method} ${req.url} 200 ${Date.now() - s} ms`)
    })

    renderStream.on('error', err => {
      if (err && err.code === '404') {
        res.status(404).end('404 | Page Not Found')
        console.log(`${req.method} ${req.url} 404 ${Date.now() - s} ms`)
        return
      }
      // Render Error Page or Redirect
      res.status(500).end('Internal Error 500')
      console.log(`${req.method} ${req.url} 500 ${Date.now() - s} ms`)
      console.error(err)
    })

  });

};
