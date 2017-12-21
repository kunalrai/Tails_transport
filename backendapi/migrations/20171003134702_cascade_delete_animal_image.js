
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('animal_images', function (table) {
            table.foreign('listing_animal_id').references('listing_animals.id').onDelete('CASCADE');
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('blueprint_details', function (table) {
          table.dropForeign('listing_animal_id');
        })
      ]);
};
