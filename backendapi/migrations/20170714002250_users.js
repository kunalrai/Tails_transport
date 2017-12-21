
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('users', (t) => {
      t.increments().primary();
      t.string('first_name', 128);
      t.string('last_name', 128);
      t.string('email').unique().notNullable();
      t.string('password', 72).notNullable();
      t.string('street', 255);
      t.string('city', 255);
      t.string('state', 255);
      t.string('zip', 255);
      t.string('phone', 255);
      t.string('facebook_id', 255);
      t.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('users')
  ]);
};
