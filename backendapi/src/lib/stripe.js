const config = require('../config');
const stripe = require('stripe')(
  config.stripe.secret
);

module.exports = {

  create_account(data){
    console.log('data', data)
    console.log('config.stripe.secret', config.stripe.secret)
    return new Promise((resolve, reject) => {
      stripe.accounts.create(data, (err, accountData) => {
        if (err){
          reject(err);
        }
        return resolve(accountData);
      });

    });
  },

  create_customer(data){
    console.log('data', data)
    console.log('config.stripe.secret', config.stripe.secret)
    return new Promise((resolve, reject) => {
      stripe.customers.create(data, (err, accountData) => {
        if (err){
          reject(err);
        }
        return resolve(accountData);
      });

    });
  },

  create_soure(customer_id, data){
    console.log('data', data)
    console.log('config.stripe.secret', config.stripe.secret)
    return new Promise((resolve, reject) => {
      stripe.customers.createSource(customer_id, data, (err, accountData) => {
        if (err){
          reject(err);
        }
        return resolve(accountData);
      });

    });
  },

  fetch_account(account){
    return new Promise((resolve, reject) => {
      stripe.accounts.retrieve(account, (err, accountData) => {
        if (err){
          reject(err);
        }
        return resolve(accountData);
      });

    });
  },
  
  /*
    https://stripe.com/docs/api/node#update_account


  */
  update_account(account, data){
    return new Promise((resolve, reject) => {
      stripe.accounts.update(account, data, (err, accountData) => {
        if (err){
          return reject(err);
        }
        return resolve(accountData);
      });

    });
  },

  /*
    Creates a single-use login link for an Express account to access their Stripe dashboard.
  */
  /*
    Response example
    {
      "object": "login_link",
      "created": 1507665375,
      "url": "https://connect.stripe.com/express/c2a3G1vrbLEf"
    }
  */
  createLoginLink(account){
    return new Promise((resolve, reject) => {
      stripe.accounts.createLoginLink(account, (err, link) => {
        console.log(err, link)
        if (err){
          reject(err);
        }
        return resolve(link.url);
      });

    });
  },

  makeDestinationPayment(account, cardToken, amount){
    return stripe.charges.create({
      amount: amount,
      currency: "usd",
      source: cardToken,
      destination: {
        account: account,
      },
    });
  },

  makePayment(customer_id, card, amount){
    let data = {
      amount: amount,
      currency: "usd",
      customer: customer_id
    };
    if (card) {
      data.source = card;
    }
    return stripe.charges.create(data);
  },
/*
  makePaymentCart(cardToken, amount){
    return stripe.charges.create({
      amount: amount,
      currency: "usd",
      source: cardToken
    });
  },
  */

  makeTransfer(account, amount, transactionId){
    return stripe.transfers.create({
      amount: amount,
      currency: "usd",
      destination: account,
      source_transaction: transactionId
    });
  }

}
