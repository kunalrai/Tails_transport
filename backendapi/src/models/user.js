let bookshelf = require('../lib/db'),
  User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimestamps: true,
    conversations() {
      return this.belongsToMany('Conversation', 'user_conversations', 'user_id');
    }
  }, {
    getAttributes: () => {
      return [
        'id',
        'first_name',
        'last_name',
        'email',
        'street',
        'city',
        'state',
        'zip',
        'purpose',
        'avatar',
        'avatar_original',
        'cover_photo',
        'role',
        'zoom_amount',
        'cover_zoom_amount',
        'position_x',
        'position_y',
        'stripe_account_created',
        'stripe_charges_enabled',
        'stripe_payments',
        'cards',
        'created_at',
        'updated_at'
      ];
    }
  });

module.exports = bookshelf.model('User', User);
