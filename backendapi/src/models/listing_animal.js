let bookshelf = require('../lib/db'),
ListingAnimal = bookshelf.Model.extend({
    tableName: 'listing_animals',
    hasTimestamps: true,
    listing: function() {
      return this.belongsTo('Listing', 'listing_id');
    },
    images: function() {
      return this.hasMany('AnimalImage', 'listing_animal_id');
    },
  }, {
    getAttributes: () => {
      return [
        'id',
        'name',
        'breed',
        'height',
        'weight',
        'special_notes',
        'listing',
        'images',
        'listing_id',
        'listing_animal_id',
        'created_at',
        'updated_at'
      ];
    },
    getInclideAttributes: () => {
      return [
        'listing',
        'images',
      ]
    }
  });

module.exports = bookshelf.model('ListingAnimal', ListingAnimal);
