let bookshelf = require('../lib/db'),
AnimalImage = bookshelf.Model.extend({
  tableName: 'animal_images',
  hasTimestamps: true,
  listing_animal: function() {
    return this.belongsTo('ListingAnimal', 'listing_animal_id');
  },
  user: function() {
    return this.belongsTo('User', 'user_id');
  },
}, {
  getAttributes: () => {
    return [
      'id',
      'url',
      'user',
      'listing_animal_id',
      'user_id',
      'listing_animal'
    ];
  },
  getInclideAttributes: () => {
    return [
      'user',
      'listing_animal',
    ]
  }
});

module.exports = bookshelf.model('AnimalImage', AnimalImage);
