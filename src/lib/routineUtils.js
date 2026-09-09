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
 * @returns {Promise<Array>} Enriched matched courses
 */
export async function decodeAndEnrichRoutine(routineStr, semester, getFacultyDetails) {
  const sectionIds = decodeRoutineSections(routineStr);
  const allCourses = await fetchCourses(semester);
  const matchedCourses = allCourses.filter(course =>
    sectionIds.includes(course.sectionId)
  );
  return enrichCoursesWithFaculty(matchedCourses, getFacultyDetails);
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
