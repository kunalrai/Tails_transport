
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('listings', function (table) {
      table.string('status', 255)
    }),
    knex.raw("ALTER TABLE listings ALTER COLUMN budget TYPE numeric(10,2) USING budget::numeric(10,2);"),
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.raw("ALTER TABLE listings ALTER COLUMN budget TYPE string(255);"),
    knex.schema.table('listings', function (table) {
      table.dropColumn('status')
    })
  ])
};
