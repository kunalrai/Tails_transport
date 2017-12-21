
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('bids', (t) => {
      t.increments().primary();
      t.integer('user_id');
      t.integer('listing_id');
      t.text('description');
      t.decimal('cost');
      t.date('time');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('bids')
  ]);
};
