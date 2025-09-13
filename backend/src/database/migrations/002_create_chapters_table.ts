import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chapters', (table) => {
    table.increments('id').primary();
    table.integer('book_id').unsigned().notNullable()
      .references('id').inTable('books').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('content');
    table.integer('chapter_number').notNullable();
    table.integer('word_count').defaultTo(0);
    table.integer('character_count').defaultTo(0);
    table.timestamps(true, true);
    table.index(['book_id']);
    table.unique(['book_id', 'chapter_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('chapters');
}