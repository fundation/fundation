'use strict';

const async = require('asyncawait/async');
const await = require('asyncawait/await');
const fs = require('fs')
const path = require('path')
const express = require('express')
const debug = require('debug')('fundation')
const pjson = require('./package.json')

module.exports = function fundation (options) {
  const app = express()

  app.once('mount', function onmount(parent) {

    let self = this;

    // Remove sacrificial express app (krakenjs)
    parent._router.stack.pop()

    // Fundation root path
    parent.fundationRoot = __dirname
    parent.applicationRoot = path.resolve(__dirname + '/../../')

    // Config
    require('./lib/config.js')(parent)

    async (function(){
      require('./middleware/static.js')(parent, self)
      require('./middleware/vue.js')(parent, self)
      require('./middleware/middleware.js')(parent, self)
      require('./middleware/controllers.js')(parent, self)

      console.log('Fundation Ready!')
      console.log('')
    })();

  });

  console.log("Fundation: v" + pjson.version);

  return app;
};
