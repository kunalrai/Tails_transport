'use strict';

let express = require('express'),
  Promise = require('bluebird'),
  Bookshelf = require('../lib/db'),
  Message = require('../models').message,
  UserConversation = require('../models').user_conversation,
  helper = require('../lib/helper'),
  router = express.Router(),
  _ = require('lodash'),
  ExternalServices = require('../lib/external_services');

module.exports = (router, io) => {
  router.post('/', (req, res) => {
    return Bookshelf.transaction(t => {
      return Promise.props({
        message: Message.forge(req.body).save({
          user_id: req.user.id
        }, {
          transacting: t
        }),
        users: UserConversation.forge().query(qb => {
          qb.where('conversation_id', req.body.conversation_id)
          //qb.whereNot('user_id', req.user.id);
        }).fetchAll({
          columns: ['user_id'],
          transacting: t,
          withRelated: 'user'
        })
      });
    }).then((data) => {
      const message = data.message.toJSON();
      data.users.forEach(user => {
        io.in(user.get('user_id')).emit('message', message);
        if (user.attributes.user_id !== req.user.id) {
          console.log("sending to: " + user.relations.user.attributes.email);
          ExternalServices.sendMail("messageNotification", user.relations.user.attributes.email, "Someone sent you a message", {
            name: user.relations.user.attributes.first_name,
            jobPostName:"Test Message"
          }).then((data)=>{
            return;
          }).catch(err => {
            console.log(err);
            return;
          });
        }
      });
      res.json(message);
    }).catch((err) => {
      console.error(err);
      return res.status(500).json(err)
    });
  });

  // GET /, /find
  router.get('/', (req, res) => {
    let normalizedQuery = helper.normalizeQuery2({query: req.query, model: Message});
    // let normalizedQuery = helper.normalizeQuery(req.query, _.extend(Message.getAttributes(), ['conversation_id']))

    return helper.fetchPaginationData(normalizedQuery, Message, null, []).then((data) => {
      res.json(helper.indexResponse(data))
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    Message.forge({ id: req.params.id }).fetch().then((data) => {
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // PUT /:id
  router.put('/:id([0-9]+)', (req, res) => {
    Message.forge({id: req.params.id}).fetch().then(findModel => {
      return findModel.save(req.body, { method: 'update'})
    }).then(data => {
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
    Message.forge({ id: req.params.id }).destroy().then(() => {
      res.json({ status: true })
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  return router;
};
