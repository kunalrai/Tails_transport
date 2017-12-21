
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.string('avatar', 255)
      table.string('cover_photo', 255)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function (table) {
      table.dropColumn('avatar')
      table.dropColumn('cover_photo')
    })
  ])
};
