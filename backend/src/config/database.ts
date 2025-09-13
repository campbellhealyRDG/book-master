import knex, { Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './database/book_master.db';
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(__dirname, '../../', dbPath);

const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: absoluteDbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds'),
    extension: 'ts',
  },
};

const db = knex(config);

export default db;
export { config as knexConfig };