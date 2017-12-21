
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.boolean('stripe_account_created')
      table.boolean('stripe_charges_enabled')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.dropColumn('stripe_account_created')
      table.dropColumn('stripe_charges_enabled')
    })
  ])
};
