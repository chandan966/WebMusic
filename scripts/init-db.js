import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const schemaPath = fileURLToPath(new URL('../database/schema.sql', import.meta.url));

nextEnv.loadEnvConfig(process.cwd());
const { pool } = await import('../src/lib/db.js');

try {
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('PostgreSQL schema and starter tracks are ready.');
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
