let bookshelf = require('../lib/db'),
  UserConversation = bookshelf.Model.extend({
    tableName: 'user_conversations',
    hasTimestamps: true,
    user: function() {
      return this.belongsTo('User', 'user_id');
    },
    conversation: function() {
      return this.belongsTo('Conversation', 'conversation_id');
    },
  }, {
    getAttributes: () => {
      return [];
    }
  });

module.exports = bookshelf.model('UserConversation', UserConversation);
