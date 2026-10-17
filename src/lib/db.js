import pg from 'pg';

const { Pool } = pg;

const pool =
  globalThis.webMusicPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.webMusicPool = pool;
}

export { pool };
