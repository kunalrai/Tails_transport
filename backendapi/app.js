'use strict';

const server = require('./server');

require('sticky-cluster')(
  function(cb) {
    console.info(`Starting server on pid ${process.pid}`);
    return cb(server.http);
  }, {
    port: process.env.PORT || 3001,
    debug: process.env.NODE_ENV == 'development'
  }
);
