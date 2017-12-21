'use strict';

let express = require('express'),
  Listing = require('../models').listing,
  ListingAnimal = require('../models').listing_animal,
  AnimalImage = require('../models').animal_image,
  AppError = require('../lib/app_error'),
  helper = require('../lib/helper'),
  ExternalServices = require('../lib/external_services'),
  config = require('../config'),
  Bluebird = require('bluebird'),
  _ = require('lodash');

module.exports = (router, io) => {
  router.post('/', (req, res) => {

    req.body.user_id = req.user.id;

    if(!req.body.listing_id){
      return res.status(404).json({message: 'Not found params listing_id'})
    }

    if(req.body.breed){
      return res.status(400).json({message: 'You did not provide a breed.'})
    }

    Listing.forge({ id: req.body.listing_id }).fetch().then(findListing => {
      if(!findListing){
        return Promise.reject(new AppError('Not found listing', 404))
      }
      return ListingAnimal.forge(req.body).save()
    }).then((data) => {
      res.json(data.toJSON())
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  router.post('/bulk', (req, res) => {

    if(!req.body.listing_id){
      return res.status(404).json({message: 'Not found params listing_id'})
    }

    if(!req.body.animals){
      return res.status(404).json({message: 'Not found params animals'})
    }

    if(!Array.isArray(req.body.animals)){
      return res.status(400).json({message: 'Incorrect params animals'})
    }

    Listing.where({ id: req.body.listing_id, user_id: req.user.id}).fetch().then(findListing => {
      if(!findListing){
        return Promise.reject(new AppError('Not found listing', 404))
      }
      return Bluebird.map(req.body.animals, animal => {
        animal.listing_id = req.body.listing_id;
        return ListingAnimal.forge(animal).save()
      })
    }).then((data) => {
      res.json(data.map(item => item.toJSON()))
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });


  router.delete('/bulk', (req, res) => {
      if(!req.body.listing_id){
        return res.status(404).json({message: 'Not found params listing_id'})
      }

      Listing.where({ id: req.body.listing_id, user_id: req.user.id}).fetch().then(findListing => {
        if(!findListing){
          return Promise.reject(new AppError('Not found listing', 404))
        }

        if (req.body.ids){
          if (Array.isArray(req.body.ids)){
            if (req.body.ids.length > 0)
              return ListingAnimal.where('id', 'in', req.body.ids).fetchAll();
          }
        }

        return ListingAnimal.where({listing_id: req.body.listing_id}).fetchAll();
      }).then(animals => {

        return Bluebird.map(animals.models, animal => {
          console.log('animals', animal)
          return AnimalImage.where({listing_animal_id: animal.id}).fetchAll().then(images => {
            return Bluebird.map(images.models, image => {
              return ExternalServices.DeleteFileS3(helper.getS3Key(image.get('url')), config.s3.bucket);
            })
          }).then(() => {
            return animal.destroy();
          })
        })
      }).then((data) => {
        res.json({status: true})
      }).catch((err) => {
        console.log('err', err)
        helper.errorResponse(res, [ err ]);
      })
    });

  // GET /, /find
  router.get('/', (req, res) => {
    let normalizedQuery = helper.normalizeQuery2({query: req.query, model: ListingAnimal});

    return helper.fetchPaginationData(normalizedQuery, ListingAnimal, null, []).then((data) => {
      res.json(helper.indexResponse(data))
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
    ListingAnimal.forge({ id: req.params.id }).fetch().then((data) => {
      if (!data){
        return res.status(404).json({message: 'Not found listing_animal'});
      }
      res.json(data.toJSON())
    }).catch((err) => {
      return res.status(500).json(err)
    })
  });

  // PUT /:id
  router.put('/:id([0-9]+)', (req, res) => {

    if (!_.isUndefined(req.body.listing_id) && !req.body.listing_id) {
      delete req.body.listing_id;
    }

    if (!_.isUndefined(req.body.user_id) && !req.body.user_id) {
      delete req.body.user_id;
    }

    ListingAnimal.forge({id: req.params.id}).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found listing_animal', 404))
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
    ListingAnimal.forge({ id: req.params.id }).fetch().then(findModel => {
      if(!findModel){
        return Promise.reject(new AppError('Not found listing_animal', 404))
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

  return router;
};
