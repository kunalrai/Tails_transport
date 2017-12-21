
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('conversations', (t) => {
      t.increments().primary();
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('conversations')
  ]);
};
