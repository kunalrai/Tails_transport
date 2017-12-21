let bookshelf = require('../lib/db'),
  Bid = bookshelf.Model.extend({
    tableName: 'bids',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'user_id');
    },
    listing: function() {
      return this.belongsTo('Listing', 'listing_id');
    },
  }, {
    getAttributes: () => {
      return [
        'id',
        'description',
        'cost',
        'time',
        'status',
        'listing',
        'user',
        'listing_id',
        'details',
        'created_at',
        'user_id',
        'updated_at'
      ];
    },
    getInclideAttributes: () => {
      return [
        'user',
        'listing'
      ]
    }
  });

module.exports = bookshelf.model('Bid', Bid);
