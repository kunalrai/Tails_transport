'use strict';

let express = require('express'),
  Promise = require('bluebird'),
  Bookshelf = require('../lib/db'),
  Listing = require('../models').listing,
  Bid = require('../models').bid,
  AppError = require('../lib/app_error'),
  helper = require('../lib/helper'),
  router = express.Router(),
  _ = require('lodash');

module.exports = (router, io) => {

  // GET /, /find
  router.get('/', (req, res) => {
    let my_bids = [];
    let bids_my_listings = [];
    let data = [];
    Listing.where({user_id: req.user.id, status: 'pending_peyment'}).fetchAll().then(findListings => {
      let listing_ids = [];
      if(!findListings){
        return Promise.resolve(listing_ids);
      }

      findListings.models.forEach((listing) => {
        listing_ids.push(listing.get('id'))
      });
      
      return Promise.resolve(listing_ids);
    }).then(listing_ids => {
      return Bid.where('listing_id', 'in', listing_ids).where({status: 'accepted'}).fetchAll({withRelated: {user: query => query.select('id', 'first_name', 'last_name', 'email'), listing: query => query.select('*')}});
    }).then(_bids => {
      let bids = [];
      if(_bids){
        bids = _bids.toJSON();
      }

       bids.filter(bid => !bid.details || bid.details.approved_by_bidder).map(bid => {
        let bid_tmp = Object.assign({}, bid);
        delete bid_tmp.listing;
        data.push({
          id: bid.listing.id,
          notification_type: 'pending_peyment',
          listing: bid.listing,
          bid: bid_tmp,
          date_time: new Date(bid.details.approved_at || Date.now())
        })
      });

      return Bid.where({user_id: req.user.id, status: 'accepted'}).fetchAll();
    }).then(findBids => {
      let listing_ids = [];
      if(!findBids){
        return Promise.resolve(listing_ids);
      }

      let _findBids = findBids.toJSON();

      let bids = _findBids.filter(item => !item.details || !item.details.approved_by_bidder);

      bids.forEach((bid) => {
        listing_ids.push(bid.listing_id);
      });
      
      return Promise.resolve(listing_ids);
    }).then(listing_ids => {
      return Listing.where('id', 'in', listing_ids).fetchAll({withRelated: {
        user: query => query.select('id', 'first_name', 'last_name', 'email'),
        bids: query => query.where('user_id', '=', req.user.id),
      }});
    }).then(_listings => {
      let listings = [];
      if(_listings){
        listings = _listings.toJSON();
      }


      listings.map(listing => {
        let listing_tmp = Object.assign({}, listing);
        delete listing_tmp.bids;
        data.push({
          id: listing.id,
          notification_type: 'offer_sent',
          listing: listing_tmp,
          bid: listing.bids[0],
          date_time: new Date(listing.bids[0].details.offer_sent_at || Date.now())
        })
      })

      let sort_data = [];

      _.sortBy(data, 'date_time').forEach(item => {
        sort_data.unshift(item);
      })


      return res.json(sort_data);
    }).catch(err => {
      helper.errorResponse(res, [ err ]);
    })
  });

  return router;
};
