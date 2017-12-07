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
const os = require('os');
const appHostname = os.hostname()
const appPackageJson = require('../../../package.json');
const appPackageVersion = _.get(appPackageJson, 'version', '')

/**
 * Routes
 *
 * @param {Application} app
 * @api private
 */
module.exports = async function(app, fundation) {

  /**
   * registers each controller in the controllers folder
   * @return {Promise}
   */
  function registerControllers () {
    return new Promise((resolve, reject) => {
      glob("controllers/*.js", async function (error, files) {
        // Add all of the routes
        files.forEach(async function (routePath) {
          // http://stackoverflow.com/questions/5055853/how-do-you-modularize-node-js-w-express
          debugRoutes("Route: " + routePath);
          await require(path.resolve(routePath))(app, fundation)
        })

        resolve({})
      })
    })
  }

  function appendHTMLCommentsToBody (html) {
    return html.replace('</body>', `<!-- ${moment().format('HH:mm:ss MM/DD/YY')} -->
      <!-- ${appHostname} -->
      <!-- ${appPackageVersion} -->
      </body>`)
  }

  /**
   * renders vue output
   * @param  {Request}   req
   * @param  {Response}   res
   * @param  {Function} next
   */
  function renderVue (req, res, next) {
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
      initialSize: (60 * 1024),   // start at 60 kilobytes.
      incrementAmount: (10 * 1024) // grow by 10 kilobytes each time buffer overflows.
    })

    // When Vue isn't fully ready
    if ( typeof app.renderer === 'undefined' ) {
      return res.end('...');
    }

    const handleErrors = (error) => {
      if (_.get(error, 'type', '') === 'redirect' || _.get(error, 'url', false)) {
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

    const context = {
      config: app.get('config'),
      cookies: req.cookies,
      post: req.body,
      url: req.url,
    }

    const renderStream = app.renderer.renderToStream(context)
    renderStream.setEncoding('utf8');

    pump(renderStream, writableStreamBuffer, function end (error) {
      // error handling
      if (error) {
        return handleErrors(error)
      }

      const m = context.meta.inject()
      const vueMeta = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text()
      const HTML = writableStreamBuffer.getContentsAsString('utf8').replace('<!--vue-meta-->', `${vueMeta}`)
      res.status(_.get(context, 'state.statusCode', 200))
      res.send(appendHTMLCommentsToBody(HTML))
    })
  }

  debug("Setting up Controllers");

  //
  // Enable case sensitivity
  // "/Foo" and "/foo" will be treated as seperate routes
  //
  app.set('case sensitive routing', true);

  app.renderVue = renderVue

  //
  // Add routes to express
  //
  await registerControllers()

  //
  // Add in a route for Vue
  //
  app.get('*', renderVue)
}
