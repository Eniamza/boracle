/**
 * @deprecated This file is deprecated. Please use '@/lib/db' with Drizzle ORM instead.
 * 
 * Migration guide:
 * - Import from '@/lib/db' instead of '@/lib/pgdb'
 * - Use Drizzle ORM query builders instead of raw SQL
 * - See src/lib/db/schema.js for table definitions
 * - See src/lib/db/index.js for database connection and utilities
 * 
 * Example migration:
 * 
 * Before (raw SQL):
 *   import { sql } from '@/lib/pgdb';
 *   const users = await sql`SELECT * FROM userinfo WHERE email = ${email}`;
 * 
 * After (Drizzle ORM):
 *   import { db, eq } from '@/lib/db';
 *   import { userinfo } from '@/lib/db/schema';
 *   const users = await db.select().from(userinfo).where(eq(userinfo.email, email));
 */

// lib/pgdb.js
import { Pool } from 'pg';
import 'dotenv/config'

const NODE_ENV = process.env.NODE_ENV;

function createPool() {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432), // use 6543 if you’re on the pooler and 5432 fails
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
}

let _pool;
export function getPool() {
  if (NODE_ENV === 'development') {
    if (!globalThis.__pgPool) globalThis.__pgPool = createPool();
    return globalThis.__pgPool;
  }
  if (!_pool) _pool = createPool();
  return _pool;
}

/**
 * Flexible sql():
 *  - sql('select ... where id=$1', [id])
 *  - sql`select ... where id = ${id}`
 */
export async function sql(stringsOrText, valuesMaybe) {
  const pool = getPool();

  // Tagged-template usage: stringsOrText is a TemplateStringsArray
  if (Array.isArray(stringsOrText) && Object.isFrozen(stringsOrText)) {
    const strings = stringsOrText;
    const values = Array.isArray(valuesMaybe) ? valuesMaybe : Array.prototype.slice.call(arguments, 1);

    // Build $1, $2, ... placeholders
    let text = '';
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) text += `$${i + 1}`;
    }

    const { rows } = await pool.query(text, values);
    return rows;
  }

  // Plain call style: (text, params)
  const text = stringsOrText;
  const params = valuesMaybe || [];
  const { rows } = await pool.query(text, params);
  return rows;
}

// Optional: transaction helper that also supports a client.query
export async function tx(fn) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn({
      // client.query still uses text + params form
      query: (text, params) => client.query(text, params),
    });
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Graceful shutdown
let cleanupBound = false;
if (!cleanupBound && NODE_ENV !== 'development') {
  cleanupBound = true;
  const close = async () => {
    try { await getPool().end(); console.log('Postgres pool closed'); }
    finally { process.exit(0); }
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}
