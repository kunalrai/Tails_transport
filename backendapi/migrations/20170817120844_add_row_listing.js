
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('listings', function (table) {
          table.string('pick_up_state', 255),
          table.string('pick_up_city', 255),
          table.string('pick_up_zip', 255),
          table.string('delivery_state', 255),
          table.string('delivery_city', 255),
          table.string('delivery_zip', 255)
        })
      ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('listings', function (table) {
          table.dropColumn('pick_up_state')
          table.dropColumn('pick_up_city')
          table.dropColumn('pick_up_zip')
          table.dropColumn('delivery_state')
          table.dropColumn('delivery_city')
          table.dropColumn('delivery_zip')
        })
      ])
};
