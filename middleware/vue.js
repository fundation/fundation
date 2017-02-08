'use strict';

const async          = require('asyncawait/async');
const await          = require('asyncawait/await');
const debug          = require('debug')('fundation');
const debugRoutes    = require('debug')('fundation:controllers');
const fs             = require('fs');
const glob           = require("glob");
const path           = require('path');

const isProdOrStage = ['production', 'staging'].indexOf(process.env.NODE_ENV) >= 0

/**
 * Vue
 *
 * @param {Application} app
 * @api private
 */
module.exports = function(app, fundation) {

  return new Promise(function(resolve, reject) {

    if (isProdOrStage) {
      // in production: create server renderer and index HTML from real fs
      app.renderer = createRenderer(fs.readFileSync(path.resolve(__dirname, '../../../dist/server-bundle.js'), 'utf-8'))
      app.baseHTML = parseIndex(fs.readFileSync(path.resolve(__dirname, '../../../dist/index.html'), 'utf-8'))
      resolve(true);
    } else {
      // in development: setup the dev server with watch and hot-reload,
      // and update renderer / index HTML on file change.
      require('../build/setup-dev-server')(app, {
        bundleUpdated: bundle => {
          app.renderer = createRenderer(bundle)
        },
        indexUpdated: index => {
          app.baseHTML = parseIndex(index)

          // Put the debug output here so you
          // get the proper debug execution time.
          debug("Setting up Vue")
          resolve(true);
        }
      })
    }

    function createRenderer (bundle) {
      // https://github.com/vuejs/vue/blob/next/packages/vue-server-renderer/README.md#why-use-bundlerenderer
      return require('vue-server-renderer').createBundleRenderer(bundle, {
        cache: require('lru-cache')({
          max: 1000,
          maxAge: 1000 * 60 * 15
        })
      })
    }

    function parseIndex (template) {
      return template.split('<!-- SLICE -->');
    }

  });

};
