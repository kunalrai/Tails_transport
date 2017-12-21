
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists('listing_animals', (t) => {
          t.increments().primary();
          t.integer('user_id');
          t.integer('listing_id');
          t.string('name', 255).defaultTo('Animal X');
          t.string('breed', 100);
          t.decimal('height');
          t.decimal('weight');
          t.text('special_notes');
          t.timestamps();
        })
      ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists('listing_animals')
      ]);
};
