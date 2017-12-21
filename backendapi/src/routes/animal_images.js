let express = require('express'),
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

      let key = '';

      if(!req.body.listing_animal_id){
          return res.status(404).json({message: 'Not found params listing_animal_id'})
      }

      ListingAnimal.forge({ id: req.body.listing_animal_id }).fetch().then(findListingAnimal => {
          if(!findListingAnimal){
              return Promise.reject(new AppError('Not found listing', 404))
          }
          return new Promise((resolve, reject) => {
              req.file('image').upload({maxBytes: 500*1024*1024}, function (err, uploadedFiles){
                if (err) return reject(err);
                if (!uploadedFiles || !uploadedFiles[0]){
                  return reject(new Error("file not uploaded"));
                }
                resolve(uploadedFiles[0]);
              });
            });
      }).then((uploadedFile) => {
          fileName = uploadedFile.filename;
          key = helper.getS3Key(null, '', uploadedFile.filename);
          return ExternalServices.UploadFileS3(uploadedFile, key, config.s3.bucket, false);
      }).then((output) => {
          return AnimalImage.forge({
              listing_animal_id: req.body.listing_animal_id,
              url: helper.getS3Link(key, config.s3.bucket),
              user_id: req.user.id
          }).save();
      }).then(data => {
          res.json(data.toJSON())
      }).catch((err) => {
          helper.errorResponse(res, [ err ]);
      })
  });

  router.post('/bulk', (req, res) => {

      let keys = [];

      if(!req.body.listing_animal_id){
          return res.status(404).json({message: 'Not found params listing_animal_id'})
      }

      ListingAnimal.forge({ id: req.body.listing_animal_id }).fetch().then(findListingAnimal => {
          if(!findListingAnimal){
              return Promise.reject(new AppError('Not found listing', 404))
          }
      //     return new Promise((resolve, reject) => {
      //         req.file('images').upload({maxBytes: 500*1024*1024}, function (err, uploadedFiles){
      //             if (err) return reject(err);

      //             if (!uploadedFiles || !uploadedFiles[0]){
      //             return reject(new Error("file not uploaded"));
      //             }
      //             resolve(uploadedFiles);
      //         });
      //         });
      // }).then((uploadedFiles) => {

          return Bluebird.map(req.body.images, image => {
              let key = helper.getS3Key('animals_' + Date.now());
              return ExternalServices.UploadFileS3(image, key, config.s3.bucket).then(() => key);
          })
      }).then((output) => {
          return Bluebird.map(output, key => {
              console.log('key', key)
              return AnimalImage.forge({
                  listing_animal_id: req.body.listing_animal_id,
                  url: helper.getS3Link(key, config.s3.bucket),
                  // user_id: req.user.id
              }).save();
          })
      }).then(data => {
          res.json(data.map(image => image.toJSON()))
      }).catch((err) => {
          console.log('err', err)
          helper.errorResponse(res, [ err ]);
      })
  });


  router.delete('/bulk', (req, res) => {
      Promise.resolve().then(() => {
          if(req.body.listing_animal_id){
              return ListingAnimal.forge({ id: req.body.listing_animal_id }).fetch().then(findListingAnimal => {
                  if(!findListingAnimal){
                      return Promise.reject(new AppError('Not found listing', 404))
                  }
                  return AnimalImage.where({listing_animal_id: req.body.listing_animal_id}).fetchAll();
              })
          } else if(req.body.ids) {
              if(Array.isArray(req.body.ids)){
                  return AnimalImage.where('id', 'in', req.body.ids).fetchAll()
              } else {
                  return Promise.reject(new AppError('Incorrect params ids', 400))
              }
          } else {
              return Promise.reject(new AppError('Not found params ', 404))
          }
      }).then(images => {
          return Bluebird.map(images.models, image => {
              return ExternalServices.DeleteFileS3(helper.getS3Key(image.get('url')), config.s3.bucket).then(() => {
                  return image.destroy()
              });
          })
      }).then(data => {
          res.json({status: true})
      }).catch((err) => {
          helper.errorResponse(res, [ err ]);
      })
  });

  // GET /
  router.get('/', (req, res) => {

      let normalizedQuery = helper.normalizeQuery2({query: req.query, model: AnimalImage});

      if(!normalizedQuery.filter.listing_animal_id){
          return res.status(404).json({message: 'Not found filter listing_animal_id'});
      }
      return helper.fetchPaginationData(normalizedQuery, AnimalImage, null, []).then((data) => {
          res.json(helper.indexResponse(data, AnimalImage.getAttributes()))
      }).catch((err) => {
          console.log('er',err)
          return res.status(500).json(err)
      })
    });

  // GET /:id
  router.get('/:id([0-9]+)', (req, res) => {
      AnimalImage.forge({ id: req.params.id }).fetch().then((data) => {
          if (!data){
              return res.status(404).json({message: 'Not found animal_image'});
          }
          res.json(_.pick(data.toJSON(), AnimalImage.getAttributes()))
      }).catch((err) => {
          return res.status(500).json(err)
      })
  });

  // DELETE /:id
  router.delete('/:id', (req, res) => {
      let Model;
      console.log(req.user.id)
      AnimalImage.forge({ id: req.params.id }).fetch().then(findModel => {
        if(!findModel){
          return Promise.reject(new AppError('Not found animal_image', 404))
        }
        if(findModel.get('user_id') != req.user.id){
          return Promise.reject(new AppError('Forbidden', 403))
        }
        Model = findModel;

        return ExternalServices.DeleteFileS3(helper.getS3Key(findModel.get('url')), config.s3.bucket)
      }).then(() => {
        return Model.destroy();
      }).then(() => {
        res.json({ status: true })
      }).catch((err) => {
        helper.errorResponse(res, [ err ]);
      })
  });

  return router;
};
