
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('user_conversations', (t) => {
      t.increments().primary();
      t.integer('user_id');
      t.integer('conversation_id');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('user_conversations')
  ]);
};
