import { fetchCourses } from '@/lib/api/courseFetcher';

/**
 * Decode a base64-encoded routine string into an array of section IDs.
 * @param {string} routineStr - Base64-encoded JSON array of section IDs
 * @returns {string[]} Array of section ID strings
 */
export function decodeRoutineSections(routineStr) {
  return JSON.parse(atob(routineStr));
}

/**
 * Enrich an array of courses with faculty details (name, email, image).
 * @param {Array} courses - Array of course objects with `.faculties` field
 * @param {Function} getFacultyDetails - Function from FacultyContext
 * @returns {Array} Courses with employeeName, employeeEmail, imgUrl added
 */
export function enrichCoursesWithFaculty(courses, getFacultyDetails) {
  return courses.map(course => {
    const { facultyName, facultyEmail, imgUrl } = getFacultyDetails(course.faculties);
    return {
      ...course,
      employeeName: facultyName,
      employeeEmail: facultyEmail,
      imgUrl,
    };
  });
}

/**
 * Full pipeline: decode routine → fetch courses for semester → filter by section IDs → enrich with faculty.
 * @param {string} routineStr - Base64-encoded JSON array of section IDs
 * @param {string} semester - Semester string (e.g. "Spring2026")
 * @param {Function} getFacultyDetails - Function from FacultyContext
 * @param {{onRevalidated?: (courses: Array) => void}} [options] - Called with the
 *   re-matched courses when a stale catalog is refreshed in the background
 * @returns {Promise<Array>} Enriched matched courses
 */
export async function decodeAndEnrichRoutine(routineStr, semester, getFacultyDetails, { onRevalidated } = {}) {
  const sectionIds = decodeRoutineSections(routineStr);

  const match = (allCourses) => enrichCoursesWithFaculty(
    allCourses.filter(course => sectionIds.includes(course.sectionId)),
    getFacultyDetails
  );

  const allCourses = await fetchCourses(semester, {
    // Re-derive against the refreshed catalog so the caller can update in place
    onRevalidated: onRevalidated ? (fresh) => onRevalidated(match(fresh)) : undefined,
  });

  return match(allCourses);
}

/**
 * Decode routine and fetch matched courses WITHOUT faculty enrichment.
 * Useful when faculty details are not needed (e.g. loading into editor).
 * @param {string} routineStr - Base64-encoded JSON array of section IDs
 * @param {string} semester - Semester string
 * @returns {Promise<Array>} Matched courses (not enriched)
 */
export async function decodeAndFetchRoutineCourses(routineStr, semester) {
  const sectionIds = decodeRoutineSections(routineStr);
  const allCourses = await fetchCourses(semester);
  return allCourses.filter(course => sectionIds.includes(course.sectionId));
}

/** Standard IDB cache key for routine course data */
export const routineCacheKey = (id) => `routine_cache_${id}`;

/** Standard cache TTL for routines: 30 days in milliseconds */
export const ROUTINE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

/** Standard IDB cache key for merged (friend) routine data */
export const mergedRoutineCacheKey = (id) => `merged_routine_cache_${id}`;

/** Cache TTL for a user's saved-routine lists: 7 days, revalidated on every visit */
export const ROUTINE_LIST_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Short, stable, non-reversible scope for per-account cache keys, so two accounts
 * on one device never read each other's cached lists. (djb2 — not a security
 * boundary, just a namespace.)
 */
export const userScopeKey = (email) => {
  if (!email) return 'anon';
  let hash = 5381;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) + hash + email.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
};

/** IDB cache key for a saved-routine list ('routines' | 'merged') */
export const routineListCacheKey = (email, kind) => `saved_${kind}_${userScopeKey(email)}`;

/**
 * Reads a `routine_cache_<id>` entry. Entries written before the shape was
 * unified are a bare course array; current ones are `{ routine, courses }`.
 * @returns {{routine: object|null, courses: Array}|null}
 */
export const readRoutineCache = (cached) => {
  if (!cached) return null;
  if (Array.isArray(cached)) return { routine: null, courses: cached };
  if (Array.isArray(cached.courses)) return { routine: cached.routine || null, courses: cached.courses };
  return null;
};
