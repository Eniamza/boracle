"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, WifiOff, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getPdfjs, extractPageText, parseGradesheet } from "@/components/ui/gradesheet/gradesheet-utils";
import {
  GRADE_POINT_SCALE,
  snapGradePointToScale,
  groupBySemester,
  computeMetrics,
  computeGraduationPlan,
  computeChartData,
} from "@/components/gradesheet/gradesheet-core";
import { loadLocalGradesheet, saveLocalGradesheet, clearLocalGradesheet } from "@/lib/gradesheetLocal";
import MobileUploadCard from "./MobileUploadCard";
import MetricsCard from "@/components/ui/gradesheet/MetricsCard";
import MobileTrajectory from "./MobileTrajectory";
import MobileCourseList from "./MobileCourseList";
import MobilePlanner from "./MobilePlanner";

export default function MobileGradesheetAnalyzer() {
  const [courses, setCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastParsedSemester, setLastParsedSemester] = useState(null);
  const [targetDegreeCredits, setTargetDegreeCredits] = useState("");
  const [targetCgpaValue, setTargetCgpaValue] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const autosaveTimer = useRef(null);

  // Load locally-saved sheet (no login required)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadLocalGradesheet();
      if (cancelled) return;
      if (saved?.courses?.length) {
        setCourses(saved.courses.map((c) => ({ ...c })));
        setOriginalCourses(saved.courses.map((c) => ({ ...c })));
        if (saved.lastParsedSemester) setLastParsedSemester(saved.lastParsedSemester);
        if (saved.targetDegreeCredits) setTargetDegreeCredits(saved.targetDegreeCredits);
        if (saved.targetCgpa) setTargetCgpaValue(saved.targetCgpa);
        setSavedAt(saved.savedAt || null);
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const showToastMessage = useCallback((msg, type = "success") => {
    if (type === "error") toast.error(msg);
    else toast.success(msg);
  }, []);

  const persist = useCallback(async (data) => {
    setSaveState("saving");
    const ok = await saveLocalGradesheet(data);
    if (ok) {
      setSaveState("saved");
      setSavedAt(Date.now());
      setTimeout(() => setSaveState("idle"), 1500);
    } else {
      setSaveState("idle");
    }
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    // Desktop checks file.type only; mobile browsers often omit the MIME type,
    // so accept either a PDF type or a .pdf filename.
    const isPdf = !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name || ""));
    if (!isPdf) {
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

      const withSem = parsedCourses.filter((c) => c.semester && c.semester !== "Unknown Semester");
      const lastSem = withSem.length ? withSem[withSem.length - 1].semester : null;

      setCourses(parsedCourses.map((course) => ({ ...course })));
      setOriginalCourses(parsedCourses.map((course) => ({ ...course })));
      if (lastSem) setLastParsedSemester(lastSem);
      persist({
        courses: parsedCourses,
        lastParsedSemester: lastSem,
        targetDegreeCredits: "",
        targetCgpa: "",
      });
      showToastMessage(`Extracted ${parsedCourses.length} courses!`);
    } catch (error) {
      console.error(error);
      showToastMessage("Error processing PDF.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToastMessage, persist]);

  const updateGradePoints = useCallback((index, value) => {
    const snapped = parseFloat(snapGradePointToScale(value));
    if (isNaN(snapped)) return;
    setCourses((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        gradePoints: snapped,
        qualityPoints: updated[index].credits * snapped,
      };
      return updated;
    });
  }, []);

  const deleteCourse = useCallback((index) => {
    const courseCode = courses[index]?.courseCode;
    setCourses((prev) => prev.filter((_, i) => i !== index));
    showToastMessage(`Deleted ${courseCode ?? "course"}`);
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

    setCourses((prev) => [
      ...prev,
      {
        courseCode, credits, gradePoints,
        qualityPoints: credits * gradePoints,
        isManuallyAdded: true, isRetake: false,
        retakeType: null, isFailed: false,
        semester: "Planned Courses",
      },
    ]);
    showToastMessage(`Added ${courseCode}`);
    return true;
  }, [courses, showToastMessage]);

  const resetSheet = useCallback(async () => {
    setCourses([]);
    setOriginalCourses([]);
    setLastParsedSemester(null);
    setTargetDegreeCredits("");
    setTargetCgpaValue("");
    setSavedAt(null);
    await clearLocalGradesheet();
    showToastMessage("Gradesheet cleared.");
  }, [showToastMessage]);

  // Debounced autosave whenever data changes (after hydration)
  useEffect(() => {
    if (!hydrated || !courses.length) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persist({ courses, lastParsedSemester, targetDegreeCredits, targetCgpa: targetCgpaValue });
    }, 800);
    return () => clearTimeout(autosaveTimer.current);
  }, [hydrated, courses, lastParsedSemester, targetDegreeCredits, targetCgpaValue, persist]);

  const metrics = computeMetrics(courses, originalCourses);
  const plan = computeGraduationPlan(metrics, targetDegreeCredits, targetCgpaValue);
  const semesterGroups = groupBySemester(courses);
  const chartData = computeChartData(semesterGroups, plan.targetCgpaNumber);

  const statisticsCards = [
    { label: "Courses", value: courses.length, color: "text-blue-600 dark:text-blue-400" },
    { label: "Earned Cr", value: metrics.earnedCredits.toFixed(1), sub: `of ${metrics.totalCredits.toFixed(1)} attempted`, color: "text-blue-600 dark:text-blue-400" },
    { label: "Current CGPA", value: metrics.currentActualCgpa.toFixed(2), sub: `${metrics.currentCgpa.toFixed(4)} precise`, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "New CGPA", value: metrics.newActualCgpa.toFixed(2), sub: `${metrics.newCgpa.toFixed(4)} precise`, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="px-4 pb-24 pt-4 max-w-lg mx-auto space-y-4">
      <MobileUploadCard
        courses={courses}
        lastParsedSemester={lastParsedSemester}
        loading={loading}
        onFileUpload={handleFileUpload}
        onResetSheet={resetSheet}
        savedAt={savedAt}
      />

      {/* Offline / local-only banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-300">
        <WifiOff className="w-3.5 h-3.5 shrink-0 text-gray-400" />
        <span className="flex-1">Works fully offline — no login needed. Everything stays on this device.</span>
        {saveState !== "idle" && (
          <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            {saveState === "saving" ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
            ) : (
              <><CheckCircle2 className="w-3 h-3" /> Saved</>
            )}
          </span>
        )}
        {saveState === "idle" && savedAt && (
          <span className="flex items-center gap-1 text-gray-400 shrink-0">
            <Save className="w-3 h-3" /> local
          </span>
        )}
      </div>

      {loading && !courses.length && (
        <div className="flex items-center justify-center gap-3 py-10 text-blue-600 dark:text-blue-400 font-medium">
          <Loader2 className="w-6 h-6 animate-spin" /> Processing your grade sheet…
        </div>
      )}

      {courses.length > 0 && !loading && (
        <>
          <MetricsCard statisticsCards={statisticsCards} />
          <MobileTrajectory chartData={chartData} targetCgpaNumber={plan.targetCgpaNumber} />
          <MobileCourseList
            courses={courses}
            semesterGroups={semesterGroups}
            onUpdateGradePoints={updateGradePoints}
            onDeleteCourse={deleteCourse}
            onResetGrades={resetGrades}
            onAddCourse={addNewCourse}
            gradePointScale={GRADE_POINT_SCALE}
          />
          <MobilePlanner
            targetDegreeCredits={targetDegreeCredits}
            setTargetDegreeCredits={setTargetDegreeCredits}
            targetCgpaValue={targetCgpaValue}
            setTargetCgpaValue={setTargetCgpaValue}
            degreeCreditsNumber={plan.degreeCreditsNumber}
            targetCgpaNumber={plan.targetCgpaNumber}
            remainingCredits={plan.remainingCredits}
            maxReachableCgpa={plan.maxReachableCgpa}
            requiredAverageGpa={plan.requiredAverageGpa}
            isTargetImpossible={plan.isTargetImpossible}
            gpaTolerance={plan.gpaTolerance}
          />
        </>
      )}

      {!courses.length && !loading && hydrated && (
        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white/30 dark:bg-gray-900/30">
          <div className="text-4xl mb-3 opacity-80">📈</div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">No Grades Yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Upload your BRACU unofficial transcript PDF above to analyze your CGPA right on your phone.
          </p>
        </div>
      )}
    </div>
  );
}
