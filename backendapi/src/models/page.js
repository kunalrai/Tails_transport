let bookshelf = require('../lib/db'),
  Page = bookshelf.Model.extend({
    tableName: 'pages',
    hasTimestamps: true,
  }, {
    getAttributes: () => {
      return [
        'title', 
        'content', 
        'template', 
        'created_at', 
        'updated_at'
      ];
    }
  });

module.exports = bookshelf.model('Page', Page);