'use strict';

let express = require('express'),
  Conversation = require('../models').conversation,
  Listing = require('../models').listing,
  UserConversation = require('../models').user_conversation,
  AppError = require('../lib/app_error'),
  Bookshelf = require('../lib/db'),
  helper = require('../lib/helper'),
  _ = require('lodash');

  const defaultAvatarURL = "https://s3.amazonaws.com/tails-assets/person.png";

module.exports = (router, io) => {
  router.post('/', (req, res) => {
    if (!req.body.listing_id ){
      return res.status(400).json({
        message: 'listing_id requred'
      })
    }

    if (!req.body.bidder_id ){
      return res.status(400).json({
        message: 'bidder_id requred'
      })
    }

    Listing.forge({id: req.body.listing_id}).fetch().then(findListing => {
      if(!findListing){
        return Promise.reject(new AppError('Not found listing', 404))
      }

      if(findListing.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      return Bookshelf.transaction(t => {
        return Conversation.forge({listing_id: req.body.listing_id}).save({}, {
          transacting: t
        }).then(data => {
          let conversation = data;
          return Promise.all([
            UserConversation.forge({conversation_id: data.get('id'), user_id: req.user.id}).save({}, {
              transacting: t
            }),
            UserConversation.forge({conversation_id: data.get('id'), user_id: req.body.bidder_id}).save({}, {
              transacting: t
            })
          ]).then(() => conversation);
        });
      });
    }).then((data) => {
      res.json(data.toJSON())
    }).catch((err) => {
      console.log('err', err)
      helper.errorResponse(res, [ err ]);
    })
  });

  // GET /, /find
  router.get('/', (req, res) => {
    let normalizedQuery = helper.normalizeQuery(req.query, Conversation.getAttributes(), ['users', 'listing'])
    return helper.fetchPaginationData(normalizedQuery, Conversation, {users: query => query.select('first_name', 'avatar','last_name', 'email', 'user_id').where('user_id', '!=', req.user.id)}, [], req.user.id).then((data) => {
      var conversations = helper.indexResponse(data);
      var convoModels = conversations.data.models;
      for (var i=0; i<convoModels.length;i++) {
        conversations.data.models[i].attributes.oppositeUser = convoModels[i].relations.users.models[0].attributes;
        if(conversations.data.models[i].attributes.oppositeUser.avatar === null) {
          conversations.data.models[i].attributes.oppositeUser.avatar = defaultAvatarURL;
        }
        conversations.data.models[i].relations = _.omit(conversations.data.models[i].relations, 'users');
      }
      res.json(conversations);
    }).catch((err) => {
      console.log(err);
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    Conversation.forge({ id: req.params.id }).fetch().then((data) => {
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // PUT /:id
  router.put('/:id([0-9]+)', (req, res) => {
    Conversation.forge({id: req.params.id}).fetch().then(findModel => {
      return findModel.save(req.body, { method: 'update'})
    }).then(data => {
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
    Conversation.forge({ id: req.params.id }).destroy().then(() => {
      res.json({ status: true })
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  return router;
};
