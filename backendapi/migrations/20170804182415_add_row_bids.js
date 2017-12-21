
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('bids', function (table) {
      table.string('status', 255)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('bids', function (table) {
      table.dropColumn('status')
    })
  ])
};
