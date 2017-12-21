
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('listings', function (table) {
          table.date('desired_pick_up_date')
          table.date('desired_delivery_date')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('listings', function (table) {
            table.dropColumn('desired_pick_up_date')
            table.dropColumn('desired_delivery_date')
          })
    ])
};
