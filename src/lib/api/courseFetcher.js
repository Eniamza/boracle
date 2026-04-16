import globalInfo from '@/constants/globalInfo';

const BACKUP_INDEX_URL = 'https://connect-cdn.itzmrz.xyz/connect_backup.json';
const CURRENT_COURSES_URL = 'https://usis-cdn.eniamza.com/connect.json';

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
 * Fetches course data. If a targetSemester is provided and it differs from the current global semester,
 * it attempts to fetch from the backup CDN. Otherwise, it defaults to the current CDN URL.
 */
/**
 * Fetches the backup index from the CDN and returns the backups array.
 */
export const fetchBackupIndex = async () => {
  try {
    const response = await fetch(BACKUP_INDEX_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch backup index: ${response.status}`);
    }
    const data = await response.json();
    return data.backups || [];
  } catch (error) {
    console.error('Error fetching backup index:', error);
    return [];
  }
};

export const fetchCourses = async (targetSemester) => {
  try {
    const normalizedTarget = normalizeSemester(targetSemester);
    const normalizedCurrent = normalizeSemester(globalInfo.semester);

    if (normalizedTarget && normalizedCurrent && normalizedTarget !== normalizedCurrent) {
        // It's a past semester. Fetch backup index.
        try {
            const backupRes = await fetch(BACKUP_INDEX_URL);
            if (backupRes.ok) {
                const backupData = await backupRes.json();
                if (backupData && backupData.backups) {
                    const sortedBackups = backupData.backups
                        .filter(b => normalizeSemester(b.semester) === normalizedTarget)
                        .sort((a, b) => new Date(b.backupTime) - new Date(a.backupTime));

                    if (sortedBackups.length > 0) {
                        const coursesRes = await fetch(sortedBackups[0].cdnLink);
                        if (coursesRes.ok) {
                            const data = await coursesRes.json();
                            return Array.isArray(data) ? data : (data.sections || []);
                        }
                    }
                }
            }
        } catch (backupError) {
            console.error('Error fetching backup courses:', backupError);
            // On error, fall through to current courses as a failsafe
        }
    }

    // Default to current courses
    const response = await fetch(CURRENT_COURSES_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch current courses: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.sections || []);

  } catch (error) {
    console.error('Error in fetchCourses:', error);
    throw error;
  }
};
