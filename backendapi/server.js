'use strict';

const express = require('express'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  router = express.Router(),
  ejwt = require('express-jwt'),
  jwt = require('jsonwebtoken'),
  cors = require('cors'),
  config = require('./src/config'),
  // passport = require('./src/lib/passport'),
  database = require('./src/lib/db'),
  fs = require('fs'),
  path = require('path');

app.set('database', database);

app.set('trust proxy', true)

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.urlencoded({
  limit: '500mb',
  extended: true,
  type: 'application/x-www-form-urlencoded'
}));

app.use(bodyParser.json({
  limit: '500mb',
  type: 'application/*'
}));

app.use(require('skipper')());

app.use(cookieParser());

app.use(ejwt({
    secret: config.token_secret,
  }).unless({
    path: [{
      url: '/auth/signin',
      methods: ['POST']
    }, {
      url: '/auth/signup',
      methods: ['POST']
    },{
      url: '/auth/facebook',
      methods: ['GET']
    },{
      url: '/auth/facebook/callback',
      methods: ['GET']
    },{
      url: '/auth/stripe',
      methods: ['GET']
    },{
      url: '/auth/stripe/callback',
      methods: ['GET']
    }, {
      url: '/auth/forgot_password',
      methods: ['POST']
    }, {
      url: /auth\/reset_password\/.*$/,
      methods: ['POST']
    }]
  }))

// app.use(passport.initialize());

io.adapter(require('socket.io-redis')({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379
}))

io.on('connection', socket => {
  socket.on('authorization', (data) => {
    jwt.verify(data.access_token, config.token_secret, function(err, decoded) {
      if(err) {
        socket.emit('unauthorized');
        return;
      }
      io.of('/').adapter.remoteDisconnect(data.access_token, true, () => {
        io.of('/').adapter.remoteJoin(socket.id, decoded.id, () => {
          socket.emit('authorization');
        });
      });
    });
  });
});

fs.readdirSync('./src/routes').forEach((file) => {
  router.use(`/${path.parse(file).name}`, require(`./src/routes/${file}`)(
    express.Router(),
    io
  ));
});

app.use(router);

module.exports = {
  io: io,
  http: server,
  app: app
};
