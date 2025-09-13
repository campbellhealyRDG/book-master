import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('dictionary_terms', (table) => {
    table.increments('id').primary();
    table.string('term', 255).notNullable().unique();
    table.enum('category', [
      'proper_noun',
      'technical_term',
      'character_name',
      'place_name',
      'custom'
    ]).defaultTo('custom');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_user_added').defaultTo(true);
    table.timestamps(true, true);
    table.index(['term']);
    table.index(['category']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('dictionary_terms');
}