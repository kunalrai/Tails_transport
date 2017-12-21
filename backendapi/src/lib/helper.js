const joi = require('joi');
const _ = require('lodash');
const crypto = require('crypto');
const config = require('../config');
const AppError = require('./app_error');
const jwt = require('jsonwebtoken');
const url = require('url');
const Bookshelf = require('./db');
const Conversation = require('../models').conversation;

let helper = {
  validateData(data, schema, options = {}) {
    return new Promise((resolve, reject) => {
      joi.validate(data, schema, options, function(err, value) {
        if (err) {
          return reject(err);
        }
        resolve(value);
      });
    });
  },

  normalizeQuery2({query, model, attributes, includeAttributes}){
    return helper.normalizeQuery(
      query,
      attributes ? attributes : model.getAttributes(),
      includeAttributes ? includeAttributes : model.getInclideAttributes())
  },

  normalizeQuery(query, attributes, includeAttributes = []){
    attributes.push('id');
    let filter = _.isPlainObject(query.filter) ? query.filter : {};
    filter = _.pick(filter, attributes);

    let page = _.isPlainObject(query.page) ? query.page : {};
    page = Object.assign({number: 1, size: 20}, _.pick(page, ['number', 'size']));

    if (page.number < 1) {
      page.number = 1;
    }
    if (page.size < 1) {
      page.size = 20;
    }

    let sort = [];
    if (query.sort){
      query.sort.split(',').forEach(field => {
        let direction = 'ASC';
        if (field.length > 0 && field[0] == '-'){
          direction = 'DESC';
          field = field.substr(1);
        }
        if (attributes.indexOf(field) > -1){
          sort.push({field, direction});
        }
      });
    }
    if (sort.length == 0){
      sort.push({field: 'created_at', direction: 'DESC'});
    }

    let include = [];
    if (query.include){
      include = query.include.split(',');
    }
    if (includeAttributes){
      include = _.intersection(include, includeAttributes);
    }

    return {
      filter,
      page,
      sort,
      include
    }
  },

  fetchPaginationData(query, Model, withRelated, whereArr = [], user){
    let comparison_keys = {'eq': '=', 'like': 'ILIKE', 'not': '<>', 'lt': '<', 'lte': '<=', 'gt': '>', 'gte': '>=', 'in': 'in'};
    let preparedFetch = Model.forge();
    _.mapKeys(query.filter, (value, key) => {
      if (_.isPlainObject(value)){
        _.mapKeys(value, (plainValue, comp) => {
          if (!_.isUndefined( comparison_keys[ comp ] )) {
            if (comp == 'in'){
              if (_.isString(plainValue)){
                plainValue = plainValue.split(',');
              }
            }
            whereArr.push({ attr: key, comp: comparison_keys[ comp ], value: plainValue });
          }
        });
        delete query.filter[key];
      }
    });

    preparedFetch.where(query.filter);

    whereArr.forEach((where) => {
      preparedFetch.where(where.attr, where.comp, tryParseDate(where.value));
    });

    query.sort.forEach(sortItem => {
      preparedFetch.orderBy(sortItem.field, sortItem.direction);
    });

    console.log('query.include', query.include)

    if(Model === Conversation && user) {
      preparedFetch.query(function(qb) {
        qb.whereIn('conversations.id', function() {
          this.select('conversation_id').from('user_conversations').where('user_id', user);
        });
        qb.select('*').from('conversations').leftOuterJoin(Bookshelf.knex.raw('(SELECT DISTINCT ON (conversation_id) conversation_id, message FROM messages ORDER BY conversation_id, created_at DESC) AS messages ON conversations.id = messages.conversation_id'));
      });
    }

    return preparedFetch.fetchPage({
      page: query.page.number,
      pageSize: query.page.size,
      withRelated: withRelated ? withRelated : query.include
    });
  },

  indexResponse(data, pickAttr){
    return {
      total: data.pagination.rowCount,
      limit: data.pagination.pageSize,
      skip: data.pagination.pageSize * data.pagination.page - data.pagination.pageSize,
      data: (Array.isArray(pickAttr)) ? data.toJSON().map(item => _.pick(item, pickAttr)) : data
    }
  },

  errorResponse(res, errors){

    if (!_.isArray(errors)) {
      errors = [ errors ];
    }

    let response = { errors: [] };
    errors.forEach((err) => {
      let error  = {"status": "500"};
      console.log('eeee', err.type)
      if (typeof err == 'number') {
        switch (err) {
        case 401:
          error = {
            "status": "401",
            "title": "Unauthorized"
          };
          break;
        case 403:
          error = {
            "status": "403",
            "title": "Forbidden"
          };
          break;
        case 404:
          error = {
            "status": "404",
            "title": "Not Found"
          };
          break;
        default:
          error = {
            "status": err.toString()
          };
        }
      } else if (err.type == 'StripeInvalidRequestError') {
        error = {
          status: "400",
          description: err.message,
          param: err.param
        };
      } else if (err.isJoi == true) {
        _errors = [];

        if(err.details){
          if(Array.isArray(err.details)){
            err.details.map(item => {
              _errors.push({
                status: "400",
                description: item.message,
                param: item.path
              })
            })
          }
        }
        response.errors = response.errors.concat(_errors);
        return;
      } else if (err instanceof Error) {
        error = {
          "status": "400",
          "description": err.message
        };
      } else if (err instanceof AppError) {
        error = err;
      } else if (_.isPlainObject(err)) {
        error = err;
      } else {
        error = {
          "status": err.status || "500",
          "description": err.message
        };
      }

      response.errors.push(error);
    });

    if (response.errors.length == 1) {
      res.status(response.errors[0].status);
    } else {
      res.status(400);
    }
    res.json(response);
  },

  getS3Link(key, bucket) {
    return `https://s3-${config.s3.region}.amazonaws.com/${bucket}/${key}`
  },

  getS3Key(link, prefix = '', filename = null) {
    let key
    if (link) {
      let pathname = url.parse(link).pathname.substr(1)
      if (pathname) {
        key = pathname.split('/').slice(1).join('/')
      }
    }
    if (!key) {
      if(filename){
        key = prefix + crypto.randomBytes(20).toString('hex')+ "." + filename.split('.').pop().toLowerCase();
      } else {
        key = prefix + crypto.randomBytes(20).toString('hex') + ".jpg"
      }
    }
    return key
  },

  makeAuth(req){
    if (req.cookies && req.cookies.connect_auth) {
      try {
        let decoded = jwt.verify(req.cookies.connect_auth, config.token_secret);
        req.user = decoded;
      } catch (err) { }
    }
    return req;
  }
}

module.exports = helper;

function tryParseDate(date){
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(date)){
    return new Date(Date.parse(date));
  } else {
    return date
  }
}
