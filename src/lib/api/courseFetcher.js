import globalInfo from '@/constants/globalInfo';
import { getCacheEntry, setCache } from '@/lib/idb';

const BACKUP_INDEX_URL = 'https://connect-cdn.itzmrz.xyz/connect_backup.json';
const CURRENT_COURSES_URL = 'https://usis-cdn.eniamza.com/connect.json';

// The catalog is ~2.6MB / 2000+ sections and is served `no-cache`, so every
// consumer used to re-download it. It is cached in IDB per semester instead.
const CATALOG_TTL_CURRENT = 60 * 60 * 1000;            // 1 hour — sections/schedules shift during pre-reg
const CATALOG_TTL_PAST = 30 * 24 * 60 * 60 * 1000;     // 30 days — backups are immutable
const BACKUP_INDEX_TTL = 6 * 60 * 60 * 1000;
const BACKUP_INDEX_CACHE_KEY = 'catalog_backup_index';

const catalogCacheKey = (semester) => `catalog_${semester || 'CURRENT'}`;

// Seat counts are live data (Mercure `seatstatus`) and must never be served from
// a cache. They are dropped before the current-semester catalog is stored or
// returned, so no consumer of fetchCourses can render a stale seat count.
// Past-semester backups keep theirs — those numbers are frozen history.
const stripLiveSeats = (courses) =>
  courses.map(({ capacity, consumedSeat, ...course }) => course);

// One in-flight download per key, shared by every caller on the page
const inFlight = new Map();

const dedupe = (key, task) => {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const promise = task().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};

const readJson = async (url, errorLabel) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${errorLabel}: ${response.status}`);
  }
  return response.json();
};

const asSections = (data) => (Array.isArray(data) ? data : (data.sections || []));

// Normalize semester format to uppercase (e.g., "Spring2026" -> "SPRING2026", "SPRING26" -> "SPRING2026")
export const normalizeSemester = (semester) => {
  if (!semester) return null;
  const cleaned = semester.replace(/-/g, '').toUpperCase();
  const match = cleaned.match(/^(SPRING|SUMMER|FALL)(\d{2,4})$/);
  if (!match) return null;
  const season = match[1];
  let year = match[2];
  if (year.length === 2) {
    year = '20' + year;
  }
  return `${season}${year}`;
};

/**
 * Fetches the backup index from the CDN and returns the backups array.
 */
/**
 * @param {{onRevalidated?: (backups: Array) => void}} [options]
 *   onRevalidated fires when a background refresh replaces a stale copy, so the
 *   caller can re-render with data that landed after it already returned.
 */
export const fetchBackupIndex = async ({ onRevalidated } = {}) => {
  const download = () => dedupe(BACKUP_INDEX_CACHE_KEY, async () => {
    const data = await readJson(BACKUP_INDEX_URL, 'Failed to fetch backup index');
    const backups = data.backups || [];
    await setCache(BACKUP_INDEX_CACHE_KEY, backups, BACKUP_INDEX_TTL);
    return backups;
  });

  const entry = await getCacheEntry(BACKUP_INDEX_CACHE_KEY);
  if (entry) {
    // Stale: hand back what we have, then push the refreshed copy to the caller
    if (entry.isStale) {
      download()
        .then(fresh => onRevalidated?.(fresh))
        .catch(err => console.error('Backup index refresh failed:', err));
    }
    return entry.data;
  }

  try {
    return await download();
  } catch (error) {
    console.error('Error fetching backup index:', error);
    return [];
  }
};

/**
 * Returns the course catalog for a semester, served from IndexedDB when a fresh
 * copy is on hand. Current-semester results never carry `capacity`/`consumedSeat`
 * — read those from the live catalog/Mercure instead (see stripLiveSeats).
 */
/**
 * @param {string} [targetSemester]
 * @param {{onRevalidated?: (sections: Array) => void}} [options]
 *   onRevalidated fires when a background refresh replaces a stale catalog.
 *   Callers that render the result should use it — otherwise the screen keeps
 *   showing last visit's copy until it is mounted again.
 */
export const fetchCourses = async (targetSemester, { onRevalidated } = {}) => {
  const normalizedTarget = normalizeSemester(targetSemester);
  const normalizedCurrent = normalizeSemester(globalInfo.semester);
  const isPastSemester = !!(normalizedTarget && normalizedCurrent && normalizedTarget !== normalizedCurrent);
  const cacheKey = catalogCacheKey(isPastSemester ? normalizedTarget : normalizedCurrent);

  const download = () => dedupe(cacheKey, async () => {
    if (isPastSemester) {
      try {
        const backups = await fetchBackupIndex();
        const sortedBackups = backups
          .filter(b => normalizeSemester(b.semester) === normalizedTarget)
          .sort((a, b) => new Date(b.backupTime) - new Date(a.backupTime));

        if (sortedBackups.length > 0) {
          const sections = asSections(await readJson(sortedBackups[0].cdnLink, 'Failed to fetch backup courses'));
          // Backups are frozen snapshots — cache them whole, seats included
          await setCache(cacheKey, sections, CATALOG_TTL_PAST);
          return sections;
        }
      } catch (backupError) {
        console.error('Error fetching backup courses:', backupError);
        // On error, fall through to current courses as a failsafe
      }
    }

    const sections = stripLiveSeats(asSections(
      await readJson(CURRENT_COURSES_URL, 'Failed to fetch current courses')
    ));
    // Note the key: a failed-over past semester must not be cached as past data
    await setCache(catalogCacheKey(normalizedCurrent), sections, CATALOG_TTL_CURRENT);
    return sections;
  });

  const entry = await getCacheEntry(cacheKey);
  if (entry) {
    // Stale-while-revalidate: nobody waits 2.6MB for a catalog we already hold.
    // The caller gets the cached copy now and the fresh one via onRevalidated.
    if (entry.isStale) {
      download()
        .then(fresh => onRevalidated?.(fresh))
        .catch(err => console.error('Catalog refresh failed:', err));
    }
    return entry.data;
  }

  try {
    return await download();
  } catch (error) {
    console.error('Error in fetchCourses:', error);
    throw error;
  }
};
