
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('conversations', function (table) {
      table.integer('listing_id').references('listings.id');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('conversations', function (table) {
      table.dropColumn('listing_id');
    })
  ]);
};
