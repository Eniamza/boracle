"use client";
import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getPdfjs, extractPageText, parseGradesheet, formatSemesterName } from "@/components/ui/gradesheet/gradesheet-utils";
import SignInPrompt from "@/components/shared/SignInPrompt";
import UploadBar from "@/components/ui/gradesheet/UploadBar";
import AcademicTrajectoryChart from "@/components/ui/gradesheet/AcademicTrajectoryChart";
import CourseTable from "@/components/ui/gradesheet/CourseTable";
import MetricsCard from "@/components/ui/gradesheet/MetricsCard";
import GraduationPlanner from "@/components/ui/gradesheet/GraduationPlanner";

const GRADE_POINT_SCALE = [0.0, 0.7, 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

const snapGradePointToScale = (value) => {
  if (value === "") return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;

  let nearestGradePoint = GRADE_POINT_SCALE[0];
  let smallestDistance = Math.abs(numericValue - nearestGradePoint);

  for (const gradePoint of GRADE_POINT_SCALE) {
    const distance = Math.abs(numericValue - gradePoint);
    if (distance < smallestDistance) {
      nearestGradePoint = gradePoint;
      smallestDistance = distance;
    }
  }

  return nearestGradePoint.toFixed(1);
};

export default function GradesheetAnalyzer({ allowSave = false, savedData = null }) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const [targetDegreeCredits, setTargetDegreeCredits] = useState("");
  const [targetCgpaValue, setTargetCgpaValue] = useState("");
  const [lastParsedSemester, setLastParsedSemester] = useState(null);

  const [lastSavedState, setLastSavedState] = useState(JSON.stringify({ courses: [], targetDegreeCredits: "", targetCgpa: "" }));

  useEffect(() => {
    if (savedData && !dataLoaded) {
      if (savedData.courses?.length > 0) {
        setCourses(savedData.courses.map((course) => ({ ...course })));
        setOriginalCourses(savedData.courses.map((course) => ({ ...course })));
      }
      if (savedData.targetDegreeCredits) setTargetDegreeCredits(savedData.targetDegreeCredits);
      if (savedData.targetCgpa) setTargetCgpaValue(savedData.targetCgpa);
      if (savedData.lastParsedSemester) setLastParsedSemester(savedData.lastParsedSemester);
      
      setLastSavedState(JSON.stringify({
        courses: savedData.courses || [],
        targetDegreeCredits: savedData.targetDegreeCredits || "",
        targetCgpa: savedData.targetCgpa || ""
      }));
      setDataLoaded(true);
    }
  }, [savedData, dataLoaded]);

  const showToastMessage = useCallback((msg, type = "success") => {
    if (type === "error") toast.error(msg);
    else toast.success(msg);
  }, []);

  const currentStateString = JSON.stringify({ courses, targetDegreeCredits, targetCgpa: targetCgpaValue });
  const hasUnsavedChanges = courses.length > 0 && lastSavedState !== currentStateString;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      showToastMessage("Please select a valid PDF file.", "error");
      return;
    }
    setLoading(true);
    try {
      const pdfjs = await getPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocument = await pdfjs.getDocument(arrayBuffer).promise;
      const parsedPages = [];

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        parsedPages.push(extractPageText(pdfDocument, pageNumber));
      }

      const textContents = await Promise.all(parsedPages);
      const parsedCourses = parseGradesheet(textContents.join("\n"));

      if (!parsedCourses.length) {
        showToastMessage("No courses found. Is this a valid BRACU grade sheet?", "error");
        return;
      }

      let lastSem = null;
      const coursesWithSem = parsedCourses.filter(c => c.semester && c.semester !== "Unknown Semester");
      if (coursesWithSem.length > 0) {
        lastSem = coursesWithSem[coursesWithSem.length - 1].semester;
      }

      setCourses(parsedCourses.map((course) => ({ ...course })));
      setOriginalCourses(parsedCourses.map((course) => ({ ...course })));
      if (lastSem) setLastParsedSemester(lastSem);

      showToastMessage(`Extracted ${parsedCourses.length} courses!`);
    } catch (error) {
      console.error(error);
      showToastMessage("Error processing PDF.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToastMessage]);

  const updateGradePoints = useCallback((index, value) => {
    const snappedGradePoints = snapGradePointToScale(value);
    const parsedGradePoints = parseFloat(snappedGradePoints);
    if (isNaN(parsedGradePoints)) return;

    setCourses((prevCourses) => {
      const updatedCourses = [...prevCourses];
      updatedCourses[index] = {
        ...updatedCourses[index],
        gradePoints: parsedGradePoints,
        qualityPoints: updatedCourses[index].credits * parsedGradePoints
      };
      return updatedCourses;
    });
  }, []);

  const deleteCourse = useCallback((index) => {
    const courseCode = courses[index]?.courseCode;
    setCourses((prevCourses) => prevCourses.filter((_, i) => i !== index));
    showToastMessage(`Deleted ${courseCode}`);
  }, [courses, showToastMessage]);

  const resetGrades = useCallback(() => {
    if (!originalCourses.length) return;
    setCourses(originalCourses.map((course) => ({ ...course })));
    showToastMessage("Reset to original");
  }, [originalCourses, showToastMessage]);

  const addNewCourse = useCallback((newCourseInput) => {
    const courseCode = newCourseInput.code.trim().toUpperCase();
    const credits = parseFloat(newCourseInput.credits);
    const gradePoints = parseFloat(snapGradePointToScale(newCourseInput.gp));

    if (!/^[A-Z]{2,4}\d{3}[A-Z]?[A-Z0-9]?$/.test(courseCode)) {
      showToastMessage("Invalid course code", "error");
      return false;
    }
    if (courses.some((course) => course.courseCode === courseCode)) {
      showToastMessage("Course already exists", "error");
      return false;
    }
    if (isNaN(credits) || credits <= 0 || credits > 10) {
      showToastMessage("Credits must be 0.5-10", "error");
      return false;
    }
    if (isNaN(gradePoints) || gradePoints < 0 || gradePoints > 4) {
      showToastMessage("Grade points must be 0-4", "error");
      return false;
    }

    setCourses((prevCourses) => [
      ...prevCourses,
      {
        courseCode, credits, gradePoints,
        qualityPoints: credits * gradePoints,
        isManuallyAdded: true, isRetake: false,
        retakeType: null, isFailed: false,
        semester: "Planned Courses"
      }
    ]);

    showToastMessage(`Added ${courseCode}`);
    return true;
  }, [courses, showToastMessage]);

  const saveGradesheet = useCallback(async () => {
    if (!courses.length) return;
    if (!session?.user) {
      setShowSignInPrompt(true);
      return;
    }
    setSaving(true);
    try {
      const currentQualityPoints = originalCourses.reduce((sum, course) => sum + course.qualityPoints, 0);
      const currentCredits = originalCourses.reduce((sum, course) => sum + course.credits, 0);
      const originalCgpa = currentCredits > 0 ? currentQualityPoints / currentCredits : 0;

      const response = await fetch("/api/gradesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses, originalCgpa, lastParsedSemester,
          targetDegreeCredits, targetCgpa: targetCgpaValue
        })
      });

      if (!response.ok) throw new Error();
      setLastSavedState(currentStateString);
      showToastMessage("Gradesheet saved!");
    } catch {
      showToastMessage("Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }, [courses, originalCourses, lastParsedSemester, targetDegreeCredits, targetCgpaValue, showToastMessage, session]);

  const deleteSavedGradesheet = useCallback(async () => {
    if (!session?.user) {
      setShowSignInPrompt(true);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/gradesheet", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setCourses([]);
      setOriginalCourses([]);
      setLastParsedSemester(null);
      setTargetDegreeCredits("");
      setTargetCgpaValue("");
      setLastSavedState(JSON.stringify({ courses: [], targetDegreeCredits: "", targetCgpa: "" }));
      showToastMessage("Gradesheet deleted.");
    } catch {
      showToastMessage("Failed to delete.", "error");
    } finally {
      setSaving(false);
    }
  }, [showToastMessage, session]);

  // Calculations
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const earnedCredits = courses.reduce((sum, course) => course.gradePoints > 0 ? sum + course.credits : sum, 0);
  const totalQualityPoints = courses.reduce((sum, course) => sum + course.qualityPoints, 0);
  const newCgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  const roundToTwoDecimals = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

  const originalTotalCredits = originalCourses.reduce((sum, course) => sum + course.credits, 0);
  const originalTotalQualityPoints = originalCourses.reduce((sum, course) => sum + course.qualityPoints, 0);
  const currentCgpa = originalTotalCredits > 0 ? originalTotalQualityPoints / originalTotalCredits : 0;

  const currentActualCgpa = currentCgpa >= 0 ? (Math.floor((currentCgpa * 1000) % 10) >= 5 ? Math.ceil(currentCgpa * 100) / 100 : Math.floor(currentCgpa * 100) / 100) : 0;
  const newActualCgpa = newCgpa >= 0 ? (Math.floor((newCgpa * 1000) % 10) >= 5 ? Math.ceil(newCgpa * 100) / 100 : Math.floor(newCgpa * 100) / 100) : 0;

  // Graduation Planner logic
  const degreeCreditsNumber = parseFloat(targetDegreeCredits) || 0;
  const targetCgpaNumber = parseFloat(targetCgpaValue) || 0;
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

  // GPA Tolerance
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

  const statisticsCards = [
    { label: "Total Courses", value: courses.length, color: "text-blue-600 dark:text-blue-400" },
    { label: "Earned Credits", value: earnedCredits.toFixed(1), sub: `Attempted: ${totalCredits.toFixed(1)}`, color: "text-blue-600 dark:text-blue-400" },
    { label: "Current CGPA", value: currentActualCgpa.toFixed(2), sub: `Precise: ${currentCgpa.toFixed(4)}`, color: "text-green-600 dark:text-green-400" },
    { label: "New CGPA", value: newActualCgpa.toFixed(2), sub: `Precise: ${newCgpa.toFixed(4)}`, color: "text-purple-600 dark:text-purple-400" },
  ];

  // Group courses by semester
  const semesterGroups = [];
  courses.forEach((course, index) => {
    const sem = course.semester || "Unknown Semester";
    let group = semesterGroups.find(g => g.name === sem);
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

  const chartData = [];
  let cumQualityPoints = 0;
  let cumCredits = 0;

  semesterGroups.forEach((group) => {
    if (group.name === "Unknown Semester") return;
    let semQualityPoints = 0;
    let semCredits = 0;
    group.courses.forEach(course => {
      semQualityPoints += course.qualityPoints;
      semCredits += course.credits;
      cumQualityPoints += course.qualityPoints;
      cumCredits += course.credits;
    });
    const semGpa = semCredits > 0 ? semQualityPoints / semCredits : 0;
    const cumCgpa = cumCredits > 0 ? cumQualityPoints / cumCredits : 0;
    const formattedName = formatSemesterName(group.name);
    const shortName = formattedName.replace("Semester", "Sem").replace(" | ", "\n");
    chartData.push({
      name: shortName, fullTermName: formattedName,
      semesterGpa: parseFloat(semGpa.toFixed(2)),
      cumulativeCgpa: parseFloat(cumCgpa.toFixed(2)),
      projectedCgpa: targetCgpaNumber > 0 ? parseFloat(targetCgpaNumber.toFixed(2)) : null
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <UploadBar courses={courses} lastParsedSemester={lastParsedSemester} onFileUpload={handleFileUpload} allowSave={allowSave} saving={saving} onSave={saveGradesheet} onDelete={deleteSavedGradesheet} hasUnsavedChanges={hasUnsavedChanges} />

        {courses.length > 0 && chartData.length > 0 && !loading && (
          <AcademicTrajectoryChart chartData={chartData} targetCgpaNumber={targetCgpaNumber} />
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-blue-600 dark:text-blue-400 font-medium">
            <Loader2 className="w-6 h-6 animate-spin" /> Processing your grade sheet...
          </div>
        )}

        {courses.length > 0 && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
            <CourseTable
              courses={courses}
              semesterGroups={semesterGroups}
              onUpdateGradePoints={updateGradePoints}
              onDeleteCourse={deleteCourse}
              onResetGrades={resetGrades}
              onAddCourse={addNewCourse}
              gradePointScale={GRADE_POINT_SCALE}
            />

            <div className="flex flex-col gap-5 lg:sticky lg:top-24">
              <MetricsCard statisticsCards={statisticsCards} />

              <GraduationPlanner
                targetDegreeCredits={targetDegreeCredits}
                setTargetDegreeCredits={setTargetDegreeCredits}
                targetCgpaValue={targetCgpaValue}
                setTargetCgpaValue={setTargetCgpaValue}
                degreeCreditsNumber={degreeCreditsNumber}
                targetCgpaNumber={targetCgpaNumber}
                remainingCredits={remainingCredits}
                maxReachableCgpa={maxReachableCgpa}
                requiredAverageGpa={requiredAverageGpa}
                isTargetImpossible={isTargetImpossible}
                gpaTolerance={gpaTolerance}
              />

            </div>
          </div>
        )}

        {!courses.length && !loading && (
          <div className="text-center py-20 md:py-32 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white/30 dark:bg-gray-900/30">
            <div className="text-5xl md:text-6xl mb-4 drop-shadow-sm opacity-80">📈</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">No Grades Yet</h3>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Upload your unofficial transcript PDF using the dropzone above to instantly generate your analysis.
            </p>
          </div>
        )}

        <SignInPrompt 
          open={showSignInPrompt} 
          onOpenChange={setShowSignInPrompt} 
          featureDescription="Save, delete and customize your gradesheet with useful insights and tools!"
        />
      </div>
    </div>
  );
}
