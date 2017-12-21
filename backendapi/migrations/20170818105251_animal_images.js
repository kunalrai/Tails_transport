
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists('animal_images', (t) => {
            t.increments().primary();
            t.integer('listing_animal_id');
            t.integer('user_id');
            t.string('url', 255);
            t.string('alt', 255);
            t.timestamps();
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists('animal_images')
    ]);
};
