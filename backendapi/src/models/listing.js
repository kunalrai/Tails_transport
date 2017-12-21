let bookshelf = require('../lib/db'),
  Listing = bookshelf.Model.extend({
    tableName: 'listings',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'user_id');
    },
    bids: function(){
      return this.hasMany('Bid','listing_id')
    },
    animals: function(){
      return this.hasMany('ListingAnimal','listing_id')
    },
  }, {
    getAttributes: () => {
      return [
        'id',
        'title',
        'user_id',
//        'number_of_animals',
//        'breed_of_animals',
//        'weight_of_animal',
//        'height_of_animal',
//        'images',
        // 'pick_up_location_type',
        'pick_up_address',
        'pick_up_city',
        'pick_up_state',
        'pick_up_zip',
        'pick_up_date',
        'budget',
        // 'delivery_location_type',
        'delivery_address',
        'delivery_date',
        'delivery_city',
        'delivery_state',
        'delivery_zip',
        'other_notes',
        'bids_count',
        'desired_pick_up_date',
        'desired_delivery_date',
        'user',
        'bids',
        'status',
        'animals',
        'created_at',
        'updated_at'
      ];
    },
    getInclideAttributes: () => {
      return [
        'user',
        'animals',
        'bids'
      ]
    }
  });

module.exports = bookshelf.model('Listing', Listing);
