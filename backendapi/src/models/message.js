let bookshelf = require('../lib/db'),
  Message = bookshelf.Model.extend({
    tableName: 'messages',
    hasTimestamps: true,
    conversation: function() {
      return this.belongsTo('Conversation', 'conversation_id');
    },
    user: function() {
      return this.belongsTo('User', 'user_id');
    },
  }, {
    getAttributes: () => {
      return [
        'message',
        'conversation_id',
        'created_at',
        'updated_at',
        'user_id'
      ];
    },getInclideAttributes: () => {
      return [
        'user',
        'conversation'
      ]
    }
  });

module.exports = bookshelf.model('Message', Message);
