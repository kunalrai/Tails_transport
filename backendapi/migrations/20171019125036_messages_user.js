
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('messages', function (table) {
      table.integer('user_id').references('users.id').notNullable();
      table.boolean('read');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('messages', function (table) {
      table.dropColumn('user');
      table.dropColumn('boolean');
    })
  ]);
};
