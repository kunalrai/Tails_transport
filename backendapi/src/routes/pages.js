'use strict';

let express = require('express'),
  Page = require('../models').page,
  helper = require('../lib/helper'),
  AppError = require('../lib/app_error');

module.exports = (router, io) => {
  router.post('/', (req, res) => {
    Page.forge(req.body).save().then((data) => {
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /, /find
  router.get('/', (req, res) => {
    let normalizedQuery = helper.normalizeQuery(req.query, Page.getAttributes())

    return helper.fetchPaginationData(normalizedQuery, Page, [], []).then((data) => {
      res.json(helper.indexResponse(data))
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    Page.forge({ id: req.params.id }).fetch().then((data) => {
      if (!data){
        return res.status(404).json({message: 'Not found page'});
      }
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // PUT /:id
  router.put('/:id([0-9]+)', (req, res) => {
    Page.forge({id: req.params.id}).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found page', 404))
      }
      return findModel.save(req.body, { method: 'update'})
    }).then(data => {
      res.json(data.toJSON())
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
    Page.forge({ id: req.params.id }).destroy().then(() => {
      res.json({ status: true })
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  return router;
};
