const _ = require('lodash')
const config = require('../config')
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_PRIVATE || 'key-40a49df72069a1e951aea38d7cb2d604',//'key-cae15659aceeb6c4f81fab31b9e9dd71',
  domain: process.env.MAILGUN_DOMAIN || 'sandboxdbc3fe9d3c5c4236b89113fe10bb3454.mailgun.org'//"sandboxa94f7d055b694396b28e1a964617b6ed.mailgun.org"
});

let AWS = require('aws-sdk')
const fs = require('fs')
var Handlebars = require('handlebars');

AWS.config.update({ accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey })

module.exports = {
  sendMail(emailTemplate, email, subject, emailVars, cb) {
    return new Promise((resolve, reject)=> {
      fs.readFile("./src/emails/"+ emailTemplate +".html", "utf8", (err, data) => {
        if (err) return reject(err);
        var templateBody = data;
        templateBody = Handlebars.compile(templateBody);
        templateBody = templateBody(emailVars);
        fs.readFile("./src/emails/emailBase.html", "utf8", (err, data) => {
          if (err) return reject(err);
          var email_body = data;
          email_body = Handlebars.compile(email_body);
          email_body = email_body({content: templateBody})
          mailgun.messages().send({
            from: 'Tails Transport <noreply@tailstransport.com>',
            to: email,
            subject: subject,
            html: email_body
          }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      });
    });
  },

  UploadFileS3(file, key, bucket, isBase64 = true) {
    if(isBase64){
      return new Promise((resolve, reject) => {
        var params = {
          Bucket: bucket,
          Key: key,
          ACL: 'public-read',
          ContentDisposition: 'inline',
          ContentEncoding: 'base64',
          ContentType: 'image/jpeg',
          StorageClass: 'STANDARD'
        }
        var s3obj = new AWS.S3({params: params})
        buf = new Buffer(file.replace(/^data:image\/\w+;base64,/, ""),'base64')
        s3obj.putObject({Body: buf}, function (err, data) {
          if (err)
            return reject(err)
          return resolve(data)
        })
      })
    } else {
      return new Promise((resolve, reject) => {
        var params = {
          Bucket: bucket,
          Key: key,
          ACL: 'public-read',
          ContentDisposition: 'inline',
          ContentType: file.type,
          StorageClass: 'STANDARD'
        }
        var s3obj = new AWS.S3({params: params})
        s3obj.upload({Body: fs.createReadStream(file.fd), ContentDisposition: 'inline', StorageClass: 'STANDARD'}, function (err, data) {
          if (err)
            return reject(err)
          return resolve(data)
        })
      })
    }
  },

  DeleteFileS3(key, bucket) {

    let keys = _.isArray(key) ? key : [ key ]
    let Objects = keys.map(key => ({Key: key}))

    return new Promise((resolve, reject) => {
      let s3 = new AWS.S3()
      var params = {
        Bucket: bucket,
        Delete: {
          Objects
        },
      }

      s3.deleteObjects(params, function(err, data) {
        if (err)
          return reject(err)
        return resolve(data)
      })
    })

  }

}
