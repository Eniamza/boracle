// Local persistence for the mobile gradesheet view — no login required.
// Uses its OWN database name: idb.js opens boracle-db at version 1 with a
// 'cache-store' object store, and IndexedDB only runs an upgrade callback when
// the version increases — sharing that DB would leave this store uncreated and
// every read/write silently failing in the catch block.
import { openDB } from 'idb';

const DB_NAME = 'boracle-gradesheet-local';
const DB_VERSION = 1;
const STORE_NAME = 'gradesheet';
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
