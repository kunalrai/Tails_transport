
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('messages', (t) => {
      t.increments().primary();
      t.integer('conversation_id');
      t.text('message');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('messages')
  ]);
};
