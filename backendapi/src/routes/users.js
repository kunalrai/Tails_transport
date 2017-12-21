'use strict';
const bcrypt = require('bcrypt');
const config = require('../config');
const _ = require('lodash');
const ExternalServices = require('../lib/external_services');
const helper = require('../lib/helper');
const stripe = require('../lib/stripe');
const Bluebird = require('bluebird');
const AppError = require('../lib/app_error');
const defaultAvatarURL = "https://s3.amazonaws.com/tails-assets/person.png";

let express = require('express'),
  User = require('../models').user;

module.exports = (router, io) => {
  // create stripe account
  router.post('/create_stripe_account', (req, res) => {
    console.log('user', req.user)
    let user;
    User.forge({id: req.user.id}).fetch().then(_user => {
      user = _user;
      if (!user){
        return Promise.reject(new AppError('Not found user', 404))
      }
      if (user.get('stripe_account_id')){
        return Promise.reject(new AppError('User already has an account', 400));
      }
      return stripe.create_account({
        type: 'custom',
        country: 'US',
        // email: user.get("email")
      });
    }).then((stripeData) => {
      console.log('stripeData', stripeData)
      return Promise.all([
        stripeData,
        (stripeData.id)  ? user.save({stripe_account_id: stripeData.id, stripe_account_created: true}) : user
      ]);
    }).then(([stripeData, user]) => {
        res.json({stripeData, user});
    }).catch(err => helper.errorResponse(res, [ err ]));
  });

  // fetch stripe account info
  router.post('/fetch_stripe_account_info', (req, res) => {
    let user;
    User.forge({id: req.user.id}).fetch().then(_user => {
      user = _user;
      if (!user){
        return Promise.reject(new AppError('Not found user', 404))
      }
      if (!user.get('stripe_account_id')){
        return Promise.reject(new AppError('User has no', 404));
      }
      return stripe.fetch_account(user.get('stripe_account_id'));
    }).then((stripeData) => {
      res.json({stripeData});
    }).catch(err => helper.errorResponse(res, [ err ]));
  });


  // GET list users
  router.get('/', (req, res) => {
    console.log('user', req.user)
    User.forge().fetchAll().then(findUsers => {
      res.json(findUsers.toJSON().map(user => _.omit(user, ['password', 'reset_password_token'])));
    }).catch(err => res.status(500).json(err))
  });

  // GET user
  router.get('/:id([0-9]+)', (req, res) => {
    User.where({id: req.params.id}).fetch().then(findUsers => {
      if(!findUsers){
        return res.status(404).json({message: "Not found user"})
      }
      if (!findUsers.attributes.avatar) {
        findUsers.attributes.avatar = defaultAvatarURL;
      }
      res.json(_.omit(findUsers.toJSON(), ['password', 'reset_password_token']));
    }).catch(err => res.status(500).json(err))
  });

  // PUT user
  router.put('/', (req, res) => {
    let userData = req.body;
    let user;
    ['password', 'avatar', 'avatar_original', 'cover_photo'].forEach(attr => {
      if (!_.isUndefined(userData[attr]) && !userData[attr]) {
        delete userData[attr];
      }
    });

    Promise.all([
      User.forge({id: req.user.id}).fetch(),
      (userData.password) ? bcrypt.hash(userData.password, 12) : null
    ])
   .then(([_user, hashedPsw]) => {
      if(!_user){
        return res.status(404).json({message: "Not found user"});
      }
      user = _user;
      if (hashedPsw){
        userData.password = hashedPsw;
      }

      Bluebird.map(['avatar', 'avatar_original', 'cover_photo'], attr => {
        if (!userData[attr]){
          return null;
        }
        if(userData[attr].indexOf('base64') < 0){
          return null;
        }
        console.log('attr', attr)
        let key = helper.getS3Key(user.get(attr), attr);
        console.log('key', key)
        let file = '' + userData[attr];
        userData[attr] = helper.getS3Link(key, config.s3.bucket)+'?'+Date.now();
        return ExternalServices.UploadFileS3(file, key, config.s3.bucket);
      });
    }).then(() => {
      return user.save(userData, { method: 'update'});
    }).then(user => {
      res.json(user);
    }).catch((err) => {
      console.log('err', err)
      return res.status(500).json(err);
    });
  });

  router.post('/testEmail', (req, res) => {
    User.where({
      id: req.user.id
    }).fetch().then(user => {
      ExternalServices.sendMail("userRegistration", user.attributes, "This is a test email").then(function(data) {
        res.send(data);
      }).catch(err => helper.errorResponse(res, [ err ]));
    }).catch(err => helper.errorResponse(res, [ err ]));
  });

  return router;
};
