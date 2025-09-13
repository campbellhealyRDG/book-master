import db from '../config/database.js';

async function migrate() {
  try {
    console.log('Starting database migration...');

    await db.migrate.latest();

    const version = await db.migrate.currentVersion();
    console.log(`Migration complete. Current version: ${version}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();