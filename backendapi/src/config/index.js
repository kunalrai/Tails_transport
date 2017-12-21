
let config = {
  development: {
    site_front: process.env.SITE_FRONT || 'http://localhost:3000',
    site_api: process.env.SITE_API || 'http://localhost:3001',
    token_secret: process.env.TOKEN_SECRET|| 'sdfgsdfhghsdfcgjsd',
    stripe: {
      clientId: process.env.STRIPE_CLIENT_ID || 'ca_BXqYCNmWz1wTruOme4qPIpP8buJUPTW5',
      public: process.env.STRIPE_PUBLIC || 'pk_test_wMQKpAkkdm9o4Rk2YKFRu45E',
      secret: process.env.STRIPE_SECRET || 'sk_test_2oeVrZDxQ087QojbEphx3wbG'
    },
    facebook: {
      clientId: '1602203263415686',
      clientSecret: '94d27f4e1ead9a3552718d4725634975'
    },
    s3: {
      accessKey: process.env.S3_ACCESS_KEY||'AKIAJVR3VXBROH2PK72A',
      secretKey: process.env.S3_SECRET_KEY || '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',
      bucket: process.env.S3_BACKET || 'tails-images',
      region: process.env.S3_REGION || 'us-west-2'
    }
  },
  production: {
    site_front: process.env.SITE_FRONT || 'http://localhost:3000',
    site_api: process.env.SITE_API || 'http://localhost:3001',
    token_secret: process.env.TOKEN_SECRET,
    stripe: {
      clientId: process.env.STRIPE_CLIENT_ID || '',
      public: process.env.STRIPE_PUBLIC || '',
      secret: process.env.STRIPE_SECRET || ''
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '1602203263415686',
      clientSecret: process.env.FACEBOOK_CLIENT_ID || '94d27f4e1ead9a3552718d4725634975'
    },
    s3: {
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      bucket: process.env.S3_BACKET,
      region: process.env.S3_REGION
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
