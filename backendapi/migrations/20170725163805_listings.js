
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('listings', (t) => {
      t.increments().primary();
      t.integer('user_id');
      t.string('title', 255);
      t.string('animal_type', 100);
      t.integer('number_of_animals');
      t.string('breed_of_animals', 255);
      t.decimal('weight_of_animal');
      t.decimal('height_of_animal');
      t.string('images', 255);
      t.string('pick_up_location_type', 100);
      t.string('pick_up_address', 255);
      t.date('pick_up_date');
      t.string('budget', 100);
      t.string('delivery_location_type', 100);
      t.string('delivery_address', 255);
      t.date('delivery_date');
      t.text('other_notes');
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('listings')
  ]);
};
