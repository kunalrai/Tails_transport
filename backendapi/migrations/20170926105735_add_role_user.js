
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.string('role', 255).defaultTo('user')
      table.integer('zoom_amount')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.dropColumn('role')
      table.dropColumn('zoom_amount')
    })
  ])
};
