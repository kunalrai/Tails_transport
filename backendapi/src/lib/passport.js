'use strict';
let config = require('../config');
let User = require('../models').user;
let bcrypt = require('bcrypt');
let helper = require('../lib/helper');

let passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy;
const StripeStrategy = require('passport-stripe').Strategy;

passport.serializeUser(function(user, done) {
  console.log('serialize')
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log('deserialize')
  User.where({id}).fetch().then(user => {
    done(null, user.toJSON());
  }).catch(err => done(err, null));
});

passport.use(new FacebookStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.site_api + "/auth/facebook/callback",
    profileFields: ['id', 'email', "first_name", "last_name"],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    req = helper.makeAuth(req);
    let where = {};
    if (req.user){
      where = {id: req.user.id};
    } else {
      where = {facebook_id: profile.id};
    }
    User.where(where).fetch().then(findUser => {
      if(findUser){
        if(req.user)
          return findUser.save({facebook_id: profile.id}, { method: 'update'})
        else
          return Promise.resolve(findUser);
      } else {
        return User.forge({
          last_name: profile.name.familyName,
          first_name: profile.name.givenName,
          email: profile.emails[0].value,
          password: '',
          facebook_id: profile.id
        }).save();
      }
    }).then(user => {
      done(null, user.toJSON());
    })
  }
));

passport.use(new StripeStrategy({
    clientID: config.stripe.clientId,
    clientSecret: config.stripe.secret,
    callbackURL: config.site_api + "/auth/stripe/callback",
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, stripe_properties, done) {
    console.log("accessToken", accessToken);
    console.log("stripe_properties", stripe_properties);
    req = helper.makeAuth(req);
    console.log(req.user)
    let where = {};
    if (req.user){
      where = {id: req.user.id};
    } else {
      where = {stripe_account_id: stripe_properties.stripe_user_id};
    }
    User.where(where).fetch().then(findUser => {
      if(findUser){
        if(req.user)
          return findUser.save({stripe_account_id: stripe_properties.stripe_user_id});
        else
          return Promise.resolve(findUser);
      } else {
        return null;
      }
    }).then(user => {
      done(null, (user) ? user.toJSON() : {});
    }).catch(err => {
      done(err);
    })
  }
));

module.exports = passport;
