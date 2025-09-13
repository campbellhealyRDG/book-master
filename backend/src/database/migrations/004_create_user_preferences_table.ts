import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_preferences', (table) => {
    table.increments('id').primary();
    table.string('preference_key', 100).notNullable().unique();
    table.text('preference_value').notNullable();
    table.timestamps(true, true);
    table.index(['preference_key']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('user_preferences');
}