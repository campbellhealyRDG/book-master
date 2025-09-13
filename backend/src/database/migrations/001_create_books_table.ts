import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('books', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('author', 255).notNullable();
    table.text('description');
    table.integer('chapter_count').defaultTo(0);
    table.integer('word_count').defaultTo(0);
    table.integer('character_count').defaultTo(0);
    table.timestamps(true, true);
    table.index(['title']);
    table.index(['author']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('books');
}