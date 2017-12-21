
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.raw('alter table users alter column zoom_amount TYPE double precision'),
    knex.schema.raw('alter table users alter column cover_zoom_amount TYPE double precision')
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.raw('alter table users alter column zoom_amount TYPE integer'),
    knex.schema.raw('alter table users alter column cover_zoom_amount TYPE integer')
  ])
};
