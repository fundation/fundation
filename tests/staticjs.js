'use strict';

// Required libraries
var request = require('supertest');
var assert = require('chai').assert;
var fundation = require('../index.js');
var app = require('express')();

// Add fundation to express
app.use(fundation.init());

/*
describe('Static JS', function(){
  var response;

  // Run this before the test is run
  before(function(done){
    request(app)
    .get('/ui/js/common.js')
    .end(function(err, res){
      response = res;
      console.log(response.status);
      done();
    });
  });

  it('should return a 200', function(){
    console.log(response.status);
    assert.equal(response.status, 404);
  });
});
*/



