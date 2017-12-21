
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('bids', function (table) {
      table.json('details')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('bids', function (table) {
      table.dropColumn('details')
    })
  ])
};
