
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('pages', (t) => {
      t.increments().primary();
      t.string('title', 255);
      t.text('content');
      t.string('template', 255);
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('pages')
  ]);
};
