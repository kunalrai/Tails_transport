'use strict';

let express = require('express'),
  Bid = require('../models').bid,
  User = require('../models').user,
  Listing = require('../models').listing,
  helper = require('../lib/helper'),
  _ = require('lodash'),
  AppError = require('../lib/app_error'),
  ExternalServices = require('../lib/external_services');

const stripe = require('../lib/stripe');

module.exports = (router, io) => {
  router.post('/:id([0-9]+)/pay', (req, res) => {
    if (!req.body.card_token){
      return res.status(400).json({message: 'card token required'});
    }
    let bid;
    let details;
    let stripeResponse;
    Bid.forge({id: req.params.id}).fetch({
      withRelated: ['listing']
    }).then(_bid => {
      bid = _bid;
      if(!bid){
        return Promise.reject(new AppError('Not found bid', 404))
      }
      if(bid.toJSON().listing.user_id != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      return User.forge({id: req.user.id}).fetch();
    }).then(_user => {
      if(!_user){
        return Promise.reject(new AppError('Not found user', 404))
      }


      if (!_user.get('stripe_payments')){
        return stripe.create_customer({
          email: _user.get('email'),
          source: req.body.card_token,
        }).then(customer => {
          return _user.save({stripe_payments: customer.id});
        })
      }

      return _user;
    }).then(_userPaymend => {

      let userPaymend = _userPaymend.toJSON();
      if(!req.body.new_card){
        return Promise.all([
          _userPaymend,
          {id: req.body.card_token}
        ])
      }

      return stripe.create_soure(userPaymend.stripe_payments, {source: req.body.card_token}).then(source => {
        if(userPaymend.cards){
          if(userPaymend.cards.cards && Array.isArray(userPaymend.cards.cards)){

            let cards = userPaymend.cards.cards;

            if(_.findIndex(cards, ['id', source.id]) < 0){
              cards.push(source);
            }

            return Promise.all([
              _userPaymend.save({cards: { cards }}),
              source
            ]);
          }
          return Promise.all([
            _userPaymend.save({cards: {cards: [source]}}),
            source
          ]);
        }

        return Promise.all([
          _userPaymend.save({cards: {cards: [source]}}),
          source
        ]);
      });
    }).then(([userUpdate, card]) => {
      console.log('userUpdate', userUpdate)
      return stripe.makePayment(userUpdate.get('stripe_payments'), card.id, Math.round(bid.get('cost')*100));
    }).then((_stripeResponse) => {
      stripeResponse = _stripeResponse;
      details = bid.get('details') || {};
      details.charged = true;
      return Promise.all([
        bid.save({details}),
        Listing.where({id: bid.get('listing_id')}).save({status: 'pending_shipment'}, {patch: true})
      ]);
    }).then(([bid,]) => {
      res.json({stripe_response: stripeResponse, bid: bid.toJSON()});
    }).catch((err) => {
      console.log('err', err)
      helper.errorResponse(res, [ err ]);
    })
  });


  router.post('/:id([0-9]+)/transfer', (req, res) => {
    let bid;
    let stripeResponse;
    Bid.forge({id: req.params.id}).fetch({
      withRelated: ['listing', 'user']
    }).then(_bid => {
      bid = _bid;
      let plainBid = bid.toJSON();
      if(!bid){
        return Promise.reject(new AppError('Not found bid', 404))
      }

      if(plainBid.listing.user_id != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      if(!plainBid.user.stripe_account_id){
        return Promise.reject(new AppError('User has no attached stripe account', 500));
      }
      if (!plainBid.details || !plainBid.details.charged){
        return Promise.reject(new AppError('Bid is not charged', 500));
      }
      return stripe.makeTransfer(plainBid.user.stripe_account_id, Math.round(plainBid.cost * 0.968 * 0.95 * 100)/*, transactionId*/);
    }).then((_stripeResponse) => {
      stripeResponse = _stripeResponse;
      let details = bid.get('details') || {};
      details.transfered = true;
      return Promise.all([
        bid.save({details}),
        Listing.where({id: bid.get('listing_id')}).save({status: 'complete'}, {patch: true})
      ]);
    }).then(bid => {
      res.json({stripe_response: stripeResponse, bid: bid.toJSON()});
    }).catch((err) => {
      console.log('err', err)
      helper.errorResponse(res, [ err ]);
    })
  });

  router.post('/', (req, res) => {
    req.body.user_id = req.user.id;
    if(req.body.details){
      delete req.body.details;
    }
    Bid.forge(req.body).save().then((data) => {
      res.json(data.toJSON())
      // Sends Email
      Listing.where({
        id: data.attributes.listing_id
      }).fetch({withRelated:"user"}).then((model) => {
        var user = model.relations.user.attributes;
        ExternalServices.sendMail("bidNotification", user.email, "Someone bid on your listing", {name: user.first_name, jobPostName:model.attributes.title}).then((data)=>{
          return;
        }).catch(err => {
          console.log(err);
          return;
        });
      }).catch(err => {
        console.log(err);
      });
    }).catch((err) => {
      console.log(err);
      if(res.headersSent) {
        return;
      } else {
        return res.status(500).json(err)
      }
    })
  });

  // GET /, /find
  router.get('/', (req, res) => {

    let normalizedQuery = helper.normalizeQuery2({query: req.query, model: Bid});

    return helper.fetchPaginationData(normalizedQuery, Bid, null, []).then((data) => {
      res.json(helper.indexResponse(data))
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    Bid.forge({ id: req.params.id }).fetch().then((data) => {
      if (!data){
        return res.status(404).json({message: 'Not found bid'});
      }
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // put /:id
  router.put('/:id([0-9]+)', (req, res) => {
    if(req.body.details || req.body.status){
      return Promise.reject(new AppError('Forbidden', 403))
    }
    if(req.body.details){
      delete req.body.details;
    }
    if(req.body.status){
      delete req.body.status;
    }
    Bid.forge({id: req.params.id}).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found bid', 404))
      }
      if(findModel.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      req.body.user_id = req.user.id;
      return findModel.save(req.body, { method: 'update'})
    }).then(data => {
      res.json(data.toJSON())
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
    Bid.forge({ id: req.params.id }).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found bid', 404))
      }
      if(findModel.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      return findModel.destroy();
    }).then(() => {
      res.json({ status: true })
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  router.post('/accept', (req, res) => {
    if (!req.body.listing_id){
      return res.status(400).json({message: 'listing_id is requred'})
    }

    if (!req.body.bid_id){
      return res.status(400).json({message: 'bid_id is requred'})
    }

    Listing.where({id: req.body.listing_id}).fetch().then(listing => {
      if(!listing){
        return Promise.reject(new AppError('Not found listing', 404))
      }

      if(listing.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }

      listing.set('status', 'offer_sent');

      return listing.save();
    }).then(listing => {
      return Bid.where({listing_id: req.body.listing_id}).save({status: 'rejected', details: {approved_by_bidder: false}}, {patch: true});
    }).then(() => {
      return Bid.where({id: req.body.bid_id}).save({status: 'accepted', details: {approved_by_bidder: false, offer_sent_at: Date.now()}}, {patch: true});
    }).then((bid) => {
      res.json(bid.toJSON());
    }).catch(err => {
      helper.errorResponse(res, [ err ]);
    });

  });

  /*  Bidder approve proposal */
  router.post('/:id/approve', (req, res) => {
    if (!req.params.id){
      return res.status(400).json({message: 'params id is requred'})
    }

    Bid.where({id: req.params.id}).fetch().then(bid => {
      if(!bid){
        return Promise.reject(new AppError('Not found bid', 404))
      }

      if(bid.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }

      if (bid.get('status') != 'accepted'){
        return Promise.reject(new AppError('Status is not accepted', 400))
      }

      let details = bid.get('details') ? bid.get('details') : {};
      details.approved_by_bidder = true;
      details.approved_at = Date.now();

      return Promise.all([
        bid.save({details}),
        Listing.where({id: bid.get('listing_id')}).save({status: 'pending_peyment'}, {patch: true})
      ]);
    }).then(([bid,]) => {
      res.json(bid.toJSON());
    }).catch(err => {
      helper.errorResponse(res, [ err ]);
    });
  });

  router.get('/my_bids', (req, res) => {
    Bid.where({
      user_id: req.user.id
    }).fetchAll().then((data) => {
      res.json({data:data.toJSON()})
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  return router;
};
