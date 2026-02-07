// src/lib/db/index.js - Drizzle ORM Database Connection
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const NODE_ENV = process.env.NODE_ENV;

// Create the postgres connection
function createConnection() {
  const connectionString = process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
  
  return postgres(connectionString, {
    ssl: 'require',
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

// Singleton pattern for connection reuse
let _connection;
let _db;

function getConnection() {
  if (NODE_ENV === 'development') {
    // In development, use a global variable to preserve connection across HMR
    if (!globalThis.__postgresConnection) {
      globalThis.__postgresConnection = createConnection();
    }
    return globalThis.__postgresConnection;
  }
  
  // In production, use module-level singleton
  if (!_connection) {
    _connection = createConnection();
  }
  return _connection;
}

/**
 * Get the Drizzle ORM database instance
 * @returns {import('drizzle-orm/postgres-js').PostgresJsDatabase<typeof schema>}
 */
export function getDb() {
  if (NODE_ENV === 'development') {
    if (!globalThis.__drizzleDb) {
      globalThis.__drizzleDb = drizzle(getConnection(), { schema });
    }
    return globalThis.__drizzleDb;
  }
  
  if (!_db) {
    _db = drizzle(getConnection(), { schema });
  }
  return _db;
}

// Export the db instance directly for convenience
export const db = getDb();

// Export schema for use in queries
export { schema };

// Export commonly used Drizzle operators
export { eq, and, or, not, gt, gte, lt, lte, ne, isNull, isNotNull, inArray, notInArray, like, ilike, sql, desc, asc } from 'drizzle-orm';

// Helper for getting current epoch timestamp
export function getCurrentEpoch() {
  return Math.floor(Date.now() / 1000);
}

// Graceful shutdown handler
let cleanupBound = false;
if (!cleanupBound && NODE_ENV !== 'development') {
  cleanupBound = true;
  const close = async () => {
    try {
      const connection = getConnection();
      await connection.end();
      console.log('Postgres connection closed');
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}
