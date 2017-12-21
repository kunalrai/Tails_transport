
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('users', function (table) {
          table.integer('cover_zoom_amount')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('users', function (table) {
            table.dropColumn('cover_zoom_amount')
          })
    ])
};
