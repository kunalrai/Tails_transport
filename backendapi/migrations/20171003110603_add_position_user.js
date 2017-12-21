  exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.raw('alter table users add column position_x double precision'),
        knex.schema.raw('alter table users add column position_y double precision'),
    ])
  };
  
  exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.raw('alter table users drop column position_x'),
        knex.schema.raw('alter table users drop column position_y'),
    ])
  };
  