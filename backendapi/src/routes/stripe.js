'use strict';

const express = require('express');
const helper = require('../lib/helper');
const stripe = require('../lib/stripe');
const AppError = require('../lib/app_error');
const User = require('../models').user;
const Joi = require('joi');

module.exports = (router, io) => {
  router.post('/create', (req, res) => {
    helper.validateData(req.body,
      Joi.object().keys({
        email: Joi.string().email().required(),
        country: Joi.string().required(),
      }), { abortEarly: false }
    ).then(validBody => {
      return stripe.create(Object.assign({}, validBody, {
        type: 'standard',
      }));
    }).then(account => {
      res.json(user);
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    });

  });

  router.post('/create_customer', (req, res) => {
    helper.validateData(req.body,
      Joi.object().keys({
        email: Joi.string().email().required()
      }), { abortEarly: false }
    ).then(validBody => {
      return stripe.create_customer(validBody);
    }).then(customer => {
      res.json(customer);
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    });

  });

  router.post('/create_soure', (req, res) => {
    helper.validateData(req.body,
      Joi.object().keys({
        customer_id: Joi.string().required(),
        cart: Joi.object().keys({
          source: Joi.string().required()
        })
      }), { abortEarly: false }
    ).then(validBody => {
      return stripe.create_soure(validBody.customer_id,validBody.cart);
    }).then(source => {
      res.json(source);
    }).catch((err) => {
      helper.errorResponse(res, [ err ]);
    });

  });

  router.post('/verify_account', (req, res) => {
    let account;
    let user;
    Promise.resolve().then(() => {
        return User.forge({id: req.user.id}).fetch();
    }).then((_user) => {
      user = _user;

      if (!user){
        return Promise.reject(new AppError({status: 404, message: 'Not found user'}));
      }

      if(!user.get('stripe_account_id')){
        return Promise.reject(new AppError({status: 400, message: 'no account id'}));
      }
  /*
      "individual": {
            "minimum": [
              "external_account",
              "legal_entity.address.city",
              "legal_entity.address.line1",
              "legal_entity.address.postal_code",
              "legal_entity.address.state",
              "legal_entity.dob.day",
              "legal_entity.dob.month",
              "legal_entity.dob.year",
              "legal_entity.first_name",
              "legal_entity.last_name",
              "legal_entity.ssn_last_4",
              "legal_entity.type",
              "tos_acceptance.date",
              "tos_acceptance.ip"
            ],
            "additional": [
              "legal_entity.personal_id_number",
              "legal_entity.verification.document"
            ]
          },
      }
  */
      return helper.validateData(req.body,
        Joi.object().keys({
          legal_entity: Joi.object().keys({
            address: Joi.object().keys({
              city:  Joi.string().required().label('City'),
              country: Joi.string().required().label('Country'),
              line1: Joi.string().required().label('Address'),
              line2: Joi.string().empty(null),
              postal_code: Joi.string().required().label('Zip'),
              state: Joi.string().required().label('State'),
            }),
            first_name: Joi.string().required().label('First name'),
            last_name: Joi.string().required().label('Last name'),
            // ssn_last_4: Joi.string().required(),
            type: Joi.string().required(),
            personal_id_number: Joi.string().label('Personal number'),
            dob: Joi.object().keys({
              day: Joi.number().required().max(31).label('Day'),
              month: Joi.number().required().max(12).label('Month'),
              year: Joi.number().required().label('Year'),
            }),
            // personal_address: Joi.object().keys({}),
            /*
              Individual's personal ID number
                OR
              Company representative's personal ID number
            */
            // additional
            // personal_id_number: Joi.string(),
            // additional
            // verification: Joi.object().keys({
              /*
                Individual's ID
                  OR
                Company representative's ID
              */
              // document: Joi.string(),
            // })
          })
        }), { abortEarly: false, allowUnknown: true }
      );
    }).then(validBody => {
      console.log('validBody', validBody)
      validBody.tos_acceptance = {
         date: Math.round(Date.now()/1000),
         ip: req.ip
      };
      return stripe.update_account(user.get('stripe_account_id'), validBody);
    }).then(_account => {
      account = _account;
      console.log('stripe update')
      if(typeof account.charges_enabled != 'undefined'){
        return user.save({stripe_charges_enabled: account.charges_enabled});
      }
      return null;
    }).then(() => {
      res.json(account);
    }).catch((err) => {
      console.log('err', err)
      helper.errorResponse(res, [ err ]);
    });
  });

  router.post('/make_payment', (req, res) => {
    Promise.resolve().then(() => {
      return stripe.makePayment(req.query.token, req.query.amount);
    }).then(charges => {
  /*
  {
      "id": "ch_1BCEoDFMUZ051uOKHyFboIig",
      "object": "charge",
      "amount": 9900,
      "amount_refunded": 0,
      "application": null,
      "application_fee": null,
      "balance_transaction": "txn_1BCEoEFMUZ051uOKT4qT6ZHx",
      "captured": true,
      "created": 1507845941,
      "currency": "usd",
      "customer": null,
      "description": null,
      "destination": "acct_1BBL89BtD9QNE81d",
      "dispute": null,
      "failure_code": null,
      "failure_message": null,
      "fraud_details": {},
      "invoice": null,
      "livemode": false,
      "metadata": {},
      "on_behalf_of": "acct_1BBL89BtD9QNE81d",
      "order": null,
      "outcome": {
          "network_status": "approved_by_network",
          "reason": null,
          "risk_level": "normal",
          "seller_message": "Payment complete.",
          "type": "authorized"
      },
      "paid": true,
      "receipt_email": null,
      "receipt_number": null,
      "refunded": false,
      "refunds": {
          "object": "list",
          "data": [],
          "has_more": false,
          "total_count": 0,
          "url": "/v1/charges/ch_1BCEoDFMUZ051uOKHyFboIig/refunds"
      },
      "review": null,
      "shipping": null,
      "source": {
          "id": "card_1BCEoDFMUZ051uOKCHaeeyQK",
          "object": "card",
          "address_city": null,
          "address_country": null,
          "address_line1": null,
          "address_line1_check": null,
          "address_line2": null,
          "address_state": null,
          "address_zip": null,
          "address_zip_check": null,
          "brand": "Visa",
          "country": "US",
          "customer": null,
          "cvc_check": null,
          "dynamic_last4": null,
          "exp_month": 8,
          "exp_year": 2019,
          "fingerprint": "bLjK4AerBPhA7Mfd",
          "funding": "credit",
          "last4": "4242",
          "metadata": {},
          "name": null,
          "tokenization_method": null
      },
      "source_transfer": null,
      "statement_descriptor": null,
      "status": "succeeded",
      "transfer": "tr_1BCEoDFMUZ051uOKQSyXb9q4",
      "transfer_group": "group_ch_1BCEoDFMUZ051uOKHyFboIig"
  }
  */
      res.json(charges);
    }).catch(err => {
      consoe.log(err)
      helper.errorResponse(res, [ err ]);
    });

  });

  router.post('/make_payment_destination', (req, res) => {
    let account;
    Promise.resolve().then(() => {
      if (req.query.account){
        return req.query.account;
      }
      if (req.user.id) {
        return User.forge({id: req.user.id}).fetch().then(user => (user) ? user.get('stripe_account_id') : '')
      }
      return '';
    }).then((_account) => {
      account = _account;
      return stripe.makeDestinationPayment(account, req.query.token, req.query.amount);
    }).then(charges => {
  /*
  {
      "id": "ch_1BCDj6FMUZ051uOKjUNY2u3n",
      "object": "charge",
      "amount": 99,
      "amount_refunded": 0,
      "application": null,
      "application_fee": null,
      "balance_transaction": "txn_1BCDj7FMUZ051uOKHQIsLhQo",
      "captured": true,
      "created": 1507841780,
      "currency": "usd",
      "customer": null,
      "description": null,
      "destination": "acct_1BBL89BtD9QNE81d",
      "dispute": null,
      "failure_code": null,
      "failure_message": null,
      "fraud_details": {},
      "invoice": null,
      "livemode": false,
      "metadata": {},
      "on_behalf_of": "acct_1BBL89BtD9QNE81d",
      "order": null,
      "outcome": {
          "network_status": "approved_by_network",
          "reason": null,
          "risk_level": "normal",
          "seller_message": "Payment complete.",
          "type": "authorized"
      },
      "paid": true,
      "receipt_email": null,
      "receipt_number": null,
      "refunded": false,
      "refunds": {
          "object": "list",
          "data": [],
          "has_more": false,
          "total_count": 0,
          "url": "/v1/charges/ch_1BCDj6FMUZ051uOKjUNY2u3n/refunds"
      },
      "review": null,
      "shipping": null,
      "source": {
          "id": "card_1BCDj6FMUZ051uOKDRZEPWsb",
          "object": "card",
          "address_city": null,
          "address_country": null,
          "address_line1": null,
          "address_line1_check": null,
          "address_line2": null,
          "address_state": null,
          "address_zip": null,
          "address_zip_check": null,
          "brand": "Visa",
          "country": "US",
          "customer": null,
          "cvc_check": null,
          "dynamic_last4": null,
          "exp_month": 8,
          "exp_year": 2019,
          "fingerprint": "bLjK4AerBPhA7Mfd",
          "funding": "credit",
          "last4": "4242",
          "metadata": {},
          "name": null,
          "tokenization_method": null
      },
      "source_transfer": null,
      "statement_descriptor": null,
      "status": "succeeded",
      "transfer": "tr_1BCDj6FMUZ051uOKIRyYBEj3",
      "transfer_group": "group_ch_1BCDj6FMUZ051uOKjUNY2u3n"
  }

  */

      res.json(charges);
    }).catch(err => {
      consoe.log(err)
      helper.errorResponse(res, [ err ]);
    });

  });


  router.post('/make_transfer', (req, res) => {
    let account;
    Promise.resolve().then(() => {
      if (req.query.account){
        return req.query.account;
      }
      if (req.user.id) {
        return User.forge({id: req.user.id}).fetch().then(user => (user) ? user.get('stripe_account_id') : '')
      }
      return '';
    }).then((_account) => {
      account = _account;
      return stripe.makeTransfer(account, req.query.amount);
    }).then(transfer => {
  /*
  {
      "id": "ch_1BCDj6FMUZ051uOKjUNY2u3n",
      "object": "charge",
      "amount": 99,
      "amount_refunded": 0,
      "application": null,
      "application_fee": null,
      "balance_transaction": "txn_1BCDj7FMUZ051uOKHQIsLhQo",
      "captured": true,
      "created": 1507841780,
      "currency": "usd",
      "customer": null,
      "description": null,
      "destination": "acct_1BBL89BtD9QNE81d",
      "dispute": null,
      "failure_code": null,
      "failure_message": null,
      "fraud_details": {},
      "invoice": null,
      "livemode": false,
      "metadata": {},
      "on_behalf_of": "acct_1BBL89BtD9QNE81d",
      "order": null,
      "outcome": {
          "network_status": "approved_by_network",
          "reason": null,
          "risk_level": "normal",
          "seller_message": "Payment complete.",
          "type": "authorized"
      },
      "paid": true,
      "receipt_email": null,
      "receipt_number": null,
      "refunded": false,
      "refunds": {
          "object": "list",
          "data": [],
          "has_more": false,
          "total_count": 0,
          "url": "/v1/charges/ch_1BCDj6FMUZ051uOKjUNY2u3n/refunds"
      },
      "review": null,
      "shipping": null,
      "source": {
          "id": "card_1BCDj6FMUZ051uOKDRZEPWsb",
          "object": "card",
          "address_city": null,
          "address_country": null,
          "address_line1": null,
          "address_line1_check": null,
          "address_line2": null,
          "address_state": null,
          "address_zip": null,
          "address_zip_check": null,
          "brand": "Visa",
          "country": "US",
          "customer": null,
          "cvc_check": null,
          "dynamic_last4": null,
          "exp_month": 8,
          "exp_year": 2019,
          "fingerprint": "bLjK4AerBPhA7Mfd",
          "funding": "credit",
          "last4": "4242",
          "metadata": {},
          "name": null,
          "tokenization_method": null
      },
      "source_transfer": null,
      "statement_descriptor": null,
      "status": "succeeded",
      "transfer": "tr_1BCDj6FMUZ051uOKIRyYBEj3",
      "transfer_group": "group_ch_1BCDj6FMUZ051uOKjUNY2u3n"
  }

  */

      res.json(transfer);
    }).catch(err => {
      console.log(err)
      helper.errorResponse(res, [ err ]);
    });

  });

  return router;
};
