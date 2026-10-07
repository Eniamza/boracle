// Local persistence for the mobile gradesheet view — no login required.
// Stored in IndexedDB under its own store so it never collides with app caches.
import { openDB } from 'idb';

const DB_NAME = process.env.NEXT_PUBLIC_IDB_DB_NAME || 'boracle-db';
const DB_VERSION = Number(process.env.NEXT_PUBLIC_IDB_DB_VERSION) || 1;
const STORE_NAME = 'gradesheet-local';
const KEY = 'current';

/** IndexedDB is browser-only — server renders must no-op. */
const canUseIDB = () => typeof indexedDB !== 'undefined';

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const loadLocalGradesheet = async () => {
  if (!canUseIDB()) return null;
  try {
    const db = await initDB();
    return (await db.get(STORE_NAME, KEY)) || null;
  } catch (err) {
    console.error('Error loading local gradesheet:', err);
    return null;
  }
};

export const saveLocalGradesheet = async (data) => {
  if (!canUseIDB()) return false;
  try {
    const db = await initDB();
    await db.put(STORE_NAME, { ...data, savedAt: Date.now() }, KEY);
    return true;
  } catch (err) {
    console.error('Error saving local gradesheet:', err);
    return false;
  }
};

export const clearLocalGradesheet = async () => {
  if (!canUseIDB()) return;
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, KEY);
  } catch (err) {
    console.error('Error clearing local gradesheet:', err);
  }
};
