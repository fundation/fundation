process.env.VUE_ENV = 'server';
process.env.NODE_ENV = 'production';

var debug = require('debug')('fundation');
var debugVue = require('debug')('fundation:vue');
var glob = require("glob");
var path = require('path');
var fs = require("fs")
var browserify = require('browserify')
var vueify = require('vueify')
var Vue = require("vue")

module.exports = function(app, fundation) {

  debug("Setting up Vue");

  // glob.sync('components/*.vue')
  // .forEach(function (file) {
  //   var componentName = path.basename(file, '.vue');
  //   browserify(file)
  //   .transform(vueify)
  //   .bundle()
  //   .pipe(fs.createWriteStream('./public/ui/js/vue/' + componentName + '.js'));

  //   debugVue('Vue: ' + componentName);
  // });

};
