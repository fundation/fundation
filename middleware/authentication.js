'use strict';

var debug          = require('debug')('fundation');
var debugAuth      = require('debug')('fundation:auth');
var _              = require("lodash");
var passport       = require("passport");
var session        = require('express-session');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(app, fundation) {

  var config = app.get('config');
  var redis = app.get('redis');

  var userModel = fundation.model.user;

  // Only proceed if there is a session secret defined
  var secret = _.get(config, 'session.secret');
  if (secret === undefined) {
    return;
  }

  debug("Setting up Authentication");

  passport.serializeUser(function(user, done) {
    // Allow for user defined logic
    if ( userModel.serializeUser ) {
      userModel.serializeUser(user)
      .then(function(result){
        done(null, result);
      });
    } else {
      done(null, user);
    }
  });

  passport.deserializeUser(function(user, done) {
    // Allow for user defined logic
    if ( userModel.deserializeUser ) {
      userModel.deserializeUser(user)
      .then(function(result){
        done(null, result);
      });
    } else {
      done(null, user);
    }
  });

  var sessionOptions = {
    secret: secret,
    resave: true,
    saveUninitialized: true
  };

  // If redis is defined, use it for our sessions
  var redisConfig = _.get(config, 'redis');
  if (redisConfig !== undefined && redis.ready === true) {
    var RedisStore = require('connect-redis')(session);
    sessionOptions = _.merge(sessionOptions, {
      store: new RedisStore({
        client: redis,
        logErrors: true
      })
    });
  }

  app.use(session(sessionOptions)); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions

  // Expose passport to the developer
  fundation.passport = passport;

  // Google Authentication
  var google = _.get(config, 'google.auth');
  if (google !== undefined) {

    debug("  Authentication: Google");

    passport.use(new GoogleStrategy({
      clientID: google.clientID,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackURL
    },
    function(token, refreshToken, profile, done) {
      return done(null, {
        token: token,
        refreshToken: refreshToken,
        profile: profile
      });
    }));
  }

};
