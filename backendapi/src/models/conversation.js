let bookshelf = require('../lib/db'),
  Conversation = bookshelf.Model.extend({
    tableName: 'conversations',
    hasTimestamps: true,
    listing() {
      return this.belongsTo('Listing', 'listing_id')
    },
    users() {
      return this.belongsToMany('User', 'user_conversations', 'conversation_id');
    },
    user_conversations() {
      return this.hasMany('UserConversation', 'conversation_id');
    }
  }, {
    getAttributes: () => {
      return [
        'listing_id'
      ];
    }
  });

module.exports = bookshelf.model('Conversation', Conversation);
