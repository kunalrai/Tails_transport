'use strict';

let express = require('express'),
  Listing = require('../models').listing,
  AppError = require('../lib/app_error'),
  helper = require('../lib/helper'),
  _ = require('lodash');

module.exports = (router, io) => {
  router.post('/', (req, res) => {
    req.body.user_id = req.user.id;
    req.body.status = 'open';
    Listing.forge(req.body).save().then((data) => {
      res.json(_.pick(data.toJSON(), Listing.getAttributes()));
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /, /find
  router.get('/', (req, res) => {
    let normalizedQuery = helper.normalizeQuery2({query: req.query, model: Listing});

    console.log('normalizedQuery', normalizedQuery)

    let useInIds = false;
    let ids = [];
    let Bookshelf = req.app.get('database');
    Promise.resolve().then(() => {
      if (req.query.filter && (req.query.filter.breeds || req.query.filter.animals_count)){
        useInIds = true;
        let sql = "select L.id, count(LA.id) from listings L";
        sql += " LEFT JOIN listing_animals LA ON LA.listing_id = L.id ";
        sql += " WHERE 1 = 1 ";
        let values = [];
        if (req.query.filter.breeds){
          let breeds = req.query.filter.breeds.split(',');
          sql += ' AND LA.breed in ( '+breeds.map(() => '?').join(',')+' ) ';
          sql += " GROUP BY L.id ";
          values = values.concat(breeds);
        }

        if (req.query.filter.animals_count){
          sql += " GROUP BY L.id ";
          sql += " HAVING count(LA.id) = ? ";
          values.push(req.query.filter.animals_count);
        }
        return Bookshelf.knex.raw(sql, values).then((result) => {
          return result.rows.map(row => row.id);
        });
      } else {
        return null;
      }
    }).then((ids) => {
      console.log(ids)
      let whereArr = [];
      if (useInIds){
        whereArr.push({attr: 'id', comp: 'in', value: ids});
      }
      return helper.fetchPaginationData(normalizedQuery, Listing, null, whereArr);
    }).then((data) => {
      let ids = data.map(listing => listing.id);
      return Promise.all([
        data,
        req.query.include_bid_counts ? Bookshelf.knex.select('listing_id', Bookshelf.knex.raw('COUNT(id)')).from('bids').groupBy('listing_id') : []
      ]);
    }).then(([data, bid_counts]) => {
      let bidCountsObj = {};
      bid_counts.forEach(bid_count => {
        bidCountsObj[ bid_count.listing_id ] = bid_count.count * 1;
      });
      data.forEach(listing => {
        listing.set("bids_count", bidCountsObj[listing.id] || 0);
      });
      res.json(helper.indexResponse(data, Listing.getAttributes().filter(item => item != (req.query.include_bid_counts ? '' : 'bids_count'))))
    }).catch((err) => {
      console.log(err)
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    Listing.forge({ id: req.params.id }).fetch().then((data) => {
      if (!data){
        return res.status(404).json({message: 'Not found listing'});
      }
      res.json(_.pick(data.toJSON(), Listing.getAttributes()));
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // PUT /:id
  router.put('/:id([0-9]+)', (req, res) => {
    Listing.forge({id: req.params.id}).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found listing', 404))
      }
      if(findModel.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      req.body.user_id = req.user.id;
      return findModel.save(req.body, { method: 'update'})
    }).then(data => {
      res.json(_.pick(data.toJSON(), Listing.getAttributes()));
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
    Listing.forge({ id: req.params.id }).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found listing', 404))
      }
      if(findModel.get('user_id') != req.user.id){
        return Promise.reject(new AppError('Forbidden', 403))
      }
      return findModel.destroy();
    }).then(() => {
      res.json({ status: true })
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  router.get('/my_listings', (req, res) => {
    Listing.where({
      user_id: req.user.id
    }).fetchAll().then((data) => {
      res.json({data:data.toJSON()})
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  return router;
};
