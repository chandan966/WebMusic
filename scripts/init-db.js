import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import nextEnv from '@next/env';

const schemaPath = fileURLToPath(new URL('../database/schema.sql', import.meta.url));

nextEnv.loadEnvConfig(process.cwd());
const { pool } = await import('../src/lib/db.js');

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'WebMusic Admin';

  if (!email && !password) return;
  if (!email || !password) {
    throw new Error(
      'Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the initial admin account.',
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address.');
  }
  if (password.length < 12) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters.');
  }
  if (name.length > 100) {
    throw new Error('BOOTSTRAP_ADMIN_NAME must be 100 characters or fewer.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(name, email, password_hash, role)
     VALUES($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [name, email, passwordHash],
  );
  console.log(`Bootstrap admin is ready for ${email}.`);
}

try {
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  await bootstrapAdmin();
  console.log('PostgreSQL schema and starter tracks are ready.');
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
