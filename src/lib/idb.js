import { openDB } from 'idb';

const DB_NAME = process.env.NEXT_PUBLIC_IDB_DB_NAME || 'boracle-db';
const DB_VERSION = Number(process.env.NEXT_PUBLIC_IDB_DB_VERSION) || 1;
const STORE_NAME = process.env.NEXT_PUBLIC_IDB_STORE_NAME || 'cache-store';

/** IndexedDB is browser-only — server renders (OG images, RSC) must no-op. */
const canUseIDB = () => typeof indexedDB !== 'undefined';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

/**
 * Stores data in IndexedDB with a time-to-live.
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttl - Time to live in milliseconds
 */
export const setCache = async (key, data, ttl) => {
  if (!canUseIDB()) return;
  try {
    const db = await initDB();
    const expiresAt = Date.now() + ttl;
    await db.put(STORE_NAME, { data, expiresAt }, key);
  } catch (err) {
    console.error('Error setting cache in IDB:', err);
  }
};

/**
 * Retrieves data from IndexedDB if it exists and hasn't expired.
 * @param {string} key 
 * @returns {any|null} The cached data or null if expired/missing
 */
export const getCache = async (key) => {
  if (!canUseIDB()) return null;
  try {
    const db = await initDB();
    const cached = await db.get(STORE_NAME, key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      await db.delete(STORE_NAME, key);
      return null;
    }
    
    return cached.data;
  } catch (err) {
    console.error('Error getting cache from IDB:', err);
    return null;
  }
};

/**
 * Specifically for stale-while-revalidate pattern.
 * Retrieves data from IndexedDB ignoring expiration, so UI can show stale data while fetching.
 * Returns null if data doesn't exist at all.
 */
export const getStaleCache = async (key) => {
  if (!canUseIDB()) return null;
  try {
    const db = await initDB();
    const cached = await db.get(STORE_NAME, key);
    return cached ? cached.data : null;
  } catch (err) {
    console.error('Error getting stale cache from IDB:', err);
    return null;
  }
};

/**
 * Stale-while-revalidate read: returns the entry plus whether it has expired,
 * so a caller can paint immediately and decide for itself whether to refetch.
 * @param {string} key
 * @returns {Promise<{data: any, expiresAt: number, isStale: boolean}|null>}
 */
export const getCacheEntry = async (key) => {
  if (!canUseIDB()) return null;
  try {
    const db = await initDB();
    const cached = await db.get(STORE_NAME, key);
    if (!cached) return null;
    return {
      data: cached.data,
      expiresAt: cached.expiresAt,
      isStale: Date.now() > cached.expiresAt,
    };
  } catch (err) {
    console.error('Error reading cache entry from IDB:', err);
    return null;
  }
};

/**
 * Drops a cached entry — call after the underlying record is deleted server-side.
 * @param {string} key
 */
export const deleteCache = async (key) => {
  if (!canUseIDB()) return;
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
  } catch (err) {
    console.error('Error deleting cache from IDB:', err);
  }
};
