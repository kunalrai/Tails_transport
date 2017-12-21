'use strict';

let express = require('express'),
  jwt = require('jsonwebtoken'),
  User = require('../models').user,
  bcrypt = require('bcrypt'),
  crypto = require('crypto'),
  Joi = require('joi'),
  config = require('../config'),
  AppError = require('../lib/app_error'),
  passport = require('passport'),
  helper = require('../lib/helper'),
  ExternalServices = require('../lib/external_services'),
  fileStream = require('fs');

module.exports = (router, io) => {
  // signup
  router.post('/signup', (req, res) => {
    helper.validateData(req.body,
      Joi.object().keys({
        first_name: Joi.string().alphanum().max(30).required(),
        last_name: Joi.string().alphanum().max(30).required(),
        purpose: Joi.string(),
        password: Joi.string().required(),
        email: Joi.string().email().required()
      }), { abortEarly: false }
    ).then(validBody => {
      return Promise.all([
        User.where({email: validBody.email.toLowerCase()}).fetch(),
        bcrypt.hash(validBody.password, 12)
      ])
    }).then(([user, hash]) => {
      if(user){
        return Promise.reject(new AppError("this email already exists ", 401));
      }
      req.body.password = hash;
      req.body.role = 'user';
      req.body.email = req.body.email.toLowerCase();
      return User.forge(req.body).save();
    }).then(createUser => {
      let user = createUser.toJSON()
      ExternalServices.sendMail("userRegistration", user.email, "Welcome to Tails!", {name: user.first_name}).then((data)=>{
        res.json({
          access_token: jwt.sign({
            id: user.id
          }, config.token_secret),
          user
        });
      }).catch(err => helper.errorResponse(res, [ err ]));
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  });

  // signin
  router.post('/signin', (req, res) => {
    let user;
    if(!req.body.email){
      return Promise.reject(new AppError("email required", 400));
    }
    if(!req.body.password){
      return Promise.reject(new AppError("password required", 400));
    }

    req.body.email = req.body.email.toLowerCase();

    User.where({
      email: req.body.email
    }).fetch().then((_user) => {
      if (_user === null) {
        return Promise.reject(new AppError("Incorrect credentials", 401));
      }
      user = _user.toJSON()
      return bcrypt.compare(req.body.password, user.password)
    }).then(matches => {
      if (!matches) {
        return Promise.reject(new AppError("Incorrect credentials", 401));
      }
      res.json({
        access_token: jwt.sign({
          id: user.id,
        }, config.token_secret),
        user: {
          id: user.id,
          role: user.role
        }
      });
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    });
  });

  // POST /reset_password/:token
  router.post('/reset_password/:token', (req, res) => {
    let user;
    if(!req.params.token){
      return res.status(400).json({message: "Token not found"})
    }
    User.where({ reset_password_token: req.params.token }).fetch().then((_user) => {
      user = _user
      if (!user) {
        return Promise.reject(new AppError("Token not found", 400));
      }
      return bcrypt.hash(req.body.password, 12)
    }).then((hash) => {
      user.attributes.password = hash
      user.attributes.reset_password_token = null
      return user.save()
    }).then(user => {
      return res.json({ status: true })
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  })

  // POST /forgot_password
  router.post('/forgot_password', (req, res) => {
    let token = crypto.randomBytes(25).toString('hex');
    helper.validateData(req.body,
      Joi.object().keys({
        email: Joi.string().email().required()
      }), { abortEarly: false }).then(validBody => {
      return User.where({
        email: validBody.email
      }).fetch()
    }).then((user) => {
      if (!user) {
        return Promise.reject(new AppError("Email not found", 400));
      }
      user.set('reset_password_token', token)
      return user.save()
    }).then((user) => {
      var data = {
        from: "Tails Transport <noreply@tailstransport.com>",
        to: [user.get('email')],
        subject: "Password Reset",
        html: '<!DOCTYPE html><html xmlns=http://www.w3.org/1999/xhtml><meta content="text/html; charset=utf-8"http-equiv=Content-Type><meta content="width=device-width,initial-scale=1"name=viewport><title>[SUBJECT]</title><style>@media screen and (max-width:600px){table[class=container]{width:95%!important}}#outlook a{padding:0}body{width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;margin:0;padding:0}.ExternalClass{width:100%}.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td{line-height:100%}#backgroundTable{margin:0;padding:0;width:100%!important;line-height:100%!important}img{outline:0;text-decoration:none;-ms-interpolation-mode:bicubic}a img{border:none}.image_fix{display:block}p{margin:1em 0}h1,h2,h3,h4,h5,h6{color:#000!important}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color:#00f!important}h1 a:active,h2 a:active,h3 a:active,h4 a:active,h5 a:active,h6 a:active{color:red!important}h1 a:visited,h2 a:visited,h3 a:visited,h4 a:visited,h5 a:visited,h6 a:visited{color:purple!important}table td{border-collapse:collapse}table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}a{color:#000}@media only screen and (max-device-width:480px){a[href^=sms],a[href^=tel]{text-decoration:none;color:#000;pointer-events:none;cursor:default}.mobile_link a[href^=sms],.mobile_link a[href^=tel]{text-decoration:default;color:orange!important;pointer-events:auto;cursor:default}}@media only screen and (min-device-width:768px) and (max-device-width:1024px){a[href^=sms],a[href^=tel]{text-decoration:none;color:#00f;pointer-events:none;cursor:default}.mobile_link a[href^=sms],.mobile_link a[href^=tel]{text-decoration:default;color:orange!important;pointer-events:auto;cursor:default}}h2{color:#181818;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:22px;font-weight:400}a.link2{color:#fff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#fff;border-radius:4px}p{color:#555;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:160%}</style><script class="active swatch"type=colorScheme>{"name":"Default","bgBody":"ffffff","link":"fff","color":"555555","bgItem":"ffffff","title":"181818"}</script><table border=0 cellpadding=0 cellspacing=0 width=100% class=bgBody id=backgroundTable><tr><td><table border=0 cellpadding=0 cellspacing=0 width=620 align=center class=container><tr><td><table border=0 cellpadding=0 cellspacing=0 width=600 align=center class=container><tr><td class="bgItem movableContentContainer"><div class=movableContent><table border=0 cellpadding=0 cellspacing=0 width=600 align=center class=container><tr height=40><td width=200> <td width=200> <td width=200> <tr><td width=200 valign=top> <td width=200 valign=top align=center><div class="contentEditableContainer contentImageEditable"><div class=contentEditable align=center><img alt=Logo height=95.5 src="https://s3.amazonaws.com/tails-assets/logo-sm.jpg" width=205 data-default=placeholder></div></div><td width=200 valign=top> <tr height=25><td width=200> <td width=200> <td width=200> </table></div><div class=movableContent><table border=0 cellpadding=0 cellspacing=0 width=600 align=center class=container><tr><td width=100% align=center style=padding-bottom:10px;padding-top:25px colspan=3><div class="contentEditableContainer contentTextEditable"><div class=contentEditable align=center><h2>Password Reset</h2></div></div><tr><td width=100> <td width=400 align=center><div class="contentEditableContainer contentTextEditable"><div class=contentEditable align=left><p>Hello,<br><br>Click the button below to reset your password</div></div><td width=100> </table><table border=0 cellpadding=0 cellspacing=0 width=600 align=center class=container><tr><td width=200> <td width=200 align=center style=padding-top:25px><table border=0 cellpadding=0 cellspacing=0 width=200 align=center height=50><tr><td width=200 align=center style=border-radius:4px height=50 bgcolor=#27d6ff><div class="contentEditableContainer contentTextEditable"><div class=contentEditable align=center><a href=# target=_blank class="link2" style="color: #ffffff;">Reset My Password</a></div></div></table><td width=200> </table></div><div class=movableContent><table border=0 cellpadding=0 cellspacing=0 width=600 align=center class=container><tr><td width=100% colspan=2 style=padding-top:65px><hr style=height:1px;border:none;color:#333;background-color:#ddd><tr><td width=60% valign=middle height=70 style=padding-bottom:20px><div class="contentEditableContainer contentTextEditable"><div class=contentEditable align=left><span style=font-size:13px;color:#181818;font-family:Helvetica,Arial,sans-serif;line-height:200%><a href=[UNSUBSCRIBE] target=_blank style=text-decoration:none;color:#555>click here to unsubscribe</a></span></div></div><td width=40% valign=top align=right align=right height=70 style=padding-bottom:20px><table border=0 cellpadding=0 cellspacing=0 width=100% align=right><tr><td width=57%><td width=34 valign=top><div class="contentEditableContainer contentFacebookEditable"style=display:inline><div class=contentEditable><img alt=facebook height=30 src="https://s3.amazonaws.com/tails-assets/facebook.png" width=30 data-default=placeholder data-customicon=true data-max-width=30 style=margin-right:40x></div></div><td width=34 valign=top><div class="contentEditableContainer contentTwitterEditable"style=display:inline><div class=contentEditable><img alt=twitter height=30 src="https://s3.amazonaws.com/tails-assets/twitter.png" width=30 data-default=placeholder data-customicon=true data-max-width=30 style=margin-right:40x></div></div></table></table></div></table></table></table>'
      };
      return ExternalServices.sendMail(data);
    }).then(() => {
      return res.json({ status: true, reset_password_token: token })
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    })
  })

  router.get('/facebook', (req, res, next) => {
    if (req.query.token){
      res.cookie('connect_auth', req.query.token , { httpOnly: true });
    }
    passport.authenticate('facebook',{ scope: ['email', 'public_profile'] })(req, res, next);
  });

  router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: config.site_front + '/' }), (req, res) => {
    if(req.cookies.connect_auth){
      return res.redirect(config.site_front + '/profile/edit');
    } else {
      let user = req.user;
      let access_token = jwt.sign({
        id: user.id,
      }, config.token_secret);
      return res.redirect(config.site_front + '/profile?access_token=' + access_token);
    }
  });

  router.get('/stripe', (req, res, next) => {
    if (req.query.token){
      res.cookie('connect_auth', req.query.token , { httpOnly: true });
    }
    passport.authenticate('stripe', { scope: ['read_write'] })(req, res, next);
  });

  router.get('/stripe/callback', passport.authenticate('stripe', { failureRedirect: config.site_front + '/' }), (req, res) => {
    return res.redirect(config.site_front + '/');
  });

  return router;
};
