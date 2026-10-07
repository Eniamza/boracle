// Shared, presentation-free logic for the gradesheet analyzer.
// Used by both the desktop GradesheetAnalyzer and the mobile view.
import { formatSemesterName } from "@/components/ui/gradesheet/gradesheet-utils";

export const GRADE_POINT_SCALE = [0.0, 0.7, 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

export const snapGradePointToScale = (value) => {
  if (value === "") return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;

  let nearestGradePoint = GRADE_POINT_SCALE[0];
  let smallestDistance = Math.abs(numericValue - nearestGradePoint);

  for (const gradePoint of GRADE_POINT_SCALE) {
    const distance = Math.abs(gradePoint - numericValue);
    if (distance < smallestDistance) {
      nearestGradePoint = gradePoint;
      smallestDistance = distance;
    }
  }

  return nearestGradePoint.toFixed(1);
};

export const getNextGradePoint = (gradePointScale, currentValue, direction) => {
  const numericValue = Number(currentValue);
  const safeCurrentValue = Number.isNaN(numericValue) ? gradePointScale[gradePointScale.length - 1] : numericValue;

  let nearestIndex = 0;
  let smallestDistance = Math.abs(gradePointScale[0] - safeCurrentValue);

  gradePointScale.forEach((gradePoint, index) => {
    const distance = Math.abs(gradePoint - safeCurrentValue);
    if (distance < smallestDistance) {
      nearestIndex = index;
      smallestDistance = distance;
    }
  });

  const nextIndex = direction === "up"
    ? Math.min(gradePointScale.length - 1, nearestIndex + 1)
    : Math.max(0, nearestIndex - 1);

  return gradePointScale[nextIndex].toFixed(1);
};

const roundToTwoDecimals = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Shared input clamps for the graduation planner (desktop GraduationPlanner and
// mobile MobilePlanner). Empty string passes through; non-numeric passes through.
export const clampTargetCgpa = (value) => {
  if (value === "") return "";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  return String(Math.min(4, Math.max(0, numericValue)));
};

export const clampTargetDegreeCredits = (value) => {
  if (value === "") return "";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  return String(Math.max(0, numericValue));
};

// BRACU truncates CGPA to 2 decimals (banker-ish rounding used by the web app).
export const truncateCgpa = (value) =>
  value >= 0
    ? (Math.floor((value * 1000) % 10) >= 5 ? Math.ceil(value * 100) / 100 : Math.floor(value * 100) / 100)
    : 0;

export function groupBySemester(courses) {
  const semesterGroups = [];
  courses.forEach((course, index) => {
    const sem = course.semester || "Unknown Semester";
    let group = semesterGroups.find((g) => g.name === sem);
    if (!group) {
      group = { name: sem, courses: [] };
      semesterGroups.push(group);
    }
    group.courses.push({ ...course, originalIndex: index });
  });

  semesterGroups.sort((a, b) => {
    if (a.name === "Planned Courses") return 1;
    if (b.name === "Planned Courses") return -1;
    if (a.name === "Unknown Semester") return 1;
    if (b.name === "Unknown Semester") return -1;
    const numA = parseInt(a.name.match(/Semester (\d+)/i)?.[1] || "0");
    const numB = parseInt(b.name.match(/Semester (\d+)/i)?.[1] || "0");
    return numA - numB;
  });

  return semesterGroups;
}

export function computeMetrics(courses, originalCourses) {
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const earnedCredits = courses.reduce((sum, course) => (course.gradePoints > 0 ? sum + course.credits : sum), 0);
  const totalQualityPoints = courses.reduce((sum, course) => sum + course.qualityPoints, 0);
  const newCgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  const originalTotalCredits = originalCourses.reduce((sum, course) => sum + course.credits, 0);
  const originalTotalQualityPoints = originalCourses.reduce((sum, course) => sum + course.qualityPoints, 0);
  const currentCgpa = originalTotalCredits > 0 ? originalTotalQualityPoints / originalTotalCredits : 0;

  return {
    totalCredits,
    earnedCredits,
    totalQualityPoints,
    newCgpa,
    currentCgpa,
    currentActualCgpa: truncateCgpa(currentCgpa),
    newActualCgpa: truncateCgpa(newCgpa),
  };
}

export function computeGraduationPlan(metrics, targetDegreeCredits, targetCgpaValue) {
  const degreeCreditsNumber = parseFloat(targetDegreeCredits) || 0;
  const targetCgpaNumber = parseFloat(targetCgpaValue) || 0;
  const { totalCredits, totalQualityPoints, newCgpa } = metrics;

  let remainingCredits = 0;
  let maxReachableCgpa = newCgpa;
  let requiredAverageGpa = 0;
  let isTargetImpossible = false;

  if (degreeCreditsNumber > 0) {
    remainingCredits = Math.max(0, degreeCreditsNumber - totalCredits);
    if (degreeCreditsNumber > totalCredits) {
      maxReachableCgpa = roundToTwoDecimals((totalQualityPoints + remainingCredits * 4.0) / degreeCreditsNumber);
      requiredAverageGpa = roundToTwoDecimals(((degreeCreditsNumber * targetCgpaNumber) - totalQualityPoints) / remainingCredits);
      isTargetImpossible = requiredAverageGpa > 4.0;
    }
  }

  const GRADE_SCALE = [3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0.0];
  const CREDITS_PER_COURSE = 3;

  const gpaTolerance = (() => {
    if (remainingCredits <= 0 || targetCgpaNumber <= 0 || isTargetImpossible) return [];
    const remainingCourses = Math.floor(remainingCredits / CREDITS_PER_COURSE);
    if (remainingCourses <= 0) return [];
    const neededQualityPoints = degreeCreditsNumber * targetCgpaNumber - totalQualityPoints;
    const margin = remainingCredits * 4.0 - neededQualityPoints;
    const results = [];
    for (const grade of GRADE_SCALE) {
      if (grade >= 4.0) continue;
      const gpaDiff = 4.0 - grade;
      const maxN = Math.floor(margin / (gpaDiff * CREDITS_PER_COURSE));
      if (maxN > 0 && maxN <= remainingCourses) {
        results.push({ grade, count: maxN, fourCount: remainingCourses - maxN });
      }
    }
    return results;
  })();

  return { degreeCreditsNumber, targetCgpaNumber, remainingCredits, maxReachableCgpa, requiredAverageGpa, isTargetImpossible, gpaTolerance };
}

export function computeChartData(semesterGroups, targetCgpaNumber) {
  const chartData = [];
  let cumQualityPoints = 0;
  let cumCredits = 0;

  semesterGroups.forEach((group) => {
    if (group.name === "Unknown Semester") return;
    let semQualityPoints = 0;
    let semCredits = 0;
    group.courses.forEach((course) => {
      semQualityPoints += course.qualityPoints;
      semCredits += course.credits;
      cumQualityPoints += course.qualityPoints;
      cumCredits += course.credits;
    });
    const semGpa = semCredits > 0 ? semQualityPoints / semCredits : 0;
    const cumCgpa = cumCredits > 0 ? cumQualityPoints / cumCredits : 0;
    // Desktop parity: the recharts axis label is built from the formatted name.
    const formattedName = formatSemesterName(group.name);
    const shortName = formattedName.replace("Semester", "Sem").replace(" | ", "\n");
    chartData.push({
      name: shortName,
      fullTermName: formattedName,
      semesterGpa: parseFloat(semGpa.toFixed(2)),
      cumulativeCgpa: parseFloat(cumCgpa.toFixed(2)),
      projectedCgpa: targetCgpaNumber > 0 ? parseFloat(targetCgpaNumber.toFixed(2)) : null,
    });
  });

  return chartData;
}
