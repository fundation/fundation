'use strict';

// Required libraries
var request = require('supertest');
var assert = require('chai').assert;
var app = require('express')();
var fundation = require('../index.js');

describe('Empty Route', function(){
  var response;

  // Run this before the test is run
  before(function(done){
    request(app)
    .get('/')
    .end(function(err, res){
      response = res;
      done()
    });
  });

  it('should return a 404', function(){
    assert.equal(response.status, 404);
  })
})

//
//
//
describe('Homepage Route', function(){
  var response;

  // Run this before the test is run
  before(function(done){
    // Create homepage route.
    app.route('/').get(function (req, res, next) {
      res.json({ moo: "cow" })
    });

    request(app)
    .get('/')
    .end(function(err, res){
      response = res;
      done()
    });
  });

  it('should return a 200', function(){
    assert.equal(response.status, 200);
  })

  it('should have a cow', function(){
    assert.equal(response.body.moo, 'cow');
  })
})








