"use client";
import { useState } from "react";
import { Plus, RotateCcw, Trash2, Check, X, ChevronUp, ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import { formatSemesterName } from "@/components/ui/gradesheet/gradesheet-utils";
import { getNextGradePoint } from "@/components/gradesheet/gradesheet-core";

const CourseRow = ({ course, gradePointScale, onUpdateGradePoints, onDeleteCourse }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stepperBtn =
    "flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation";

  return (
    <div className="py-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{course.courseCode}</span>
            {course.isRetake && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {course.retakeType || "RT"}
              </span>
            )}
            {course.isFailed && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                F
              </span>
            )}
            {course.isManuallyAdded && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                Manual
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
            {course.credits.toFixed(2)} cr · {(course.qualityPoints).toFixed(1)} QP
          </div>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDeleteCourse(course.originalIndex)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-600 text-white active:bg-red-700"
              aria-label={`Confirm delete ${course.courseCode}`}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label={`Cancel delete ${course.courseCode}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  onUpdateGradePoints(course.originalIndex, getNextGradePoint(gradePointScale, course.gradePoints, "down"))
                }
                className={stepperBtn}
                aria-label={`Decrease ${course.courseCode} grade`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="w-12 text-center">
                <div
                  className={`text-base font-bold font-mono tabular-nums leading-tight ${
                    course.gradePoints >= 3.5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : course.gradePoints >= 2.8
                        ? "text-blue-600 dark:text-blue-400"
                        : course.gradePoints > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {course.gradePoints.toFixed(1)}
                </div>
                <div className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500">GP</div>
              </div>
              <button
                onClick={() =>
                  onUpdateGradePoints(course.originalIndex, getNextGradePoint(gradePointScale, course.gradePoints, "up"))
                }
                className={stepperBtn}
                aria-label={`Increase ${course.courseCode} grade`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-red-600 active:bg-red-50 dark:active:bg-red-900/30 transition-colors"
              aria-label={`Delete ${course.courseCode}`}
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AddCourseForm = ({ onAddCourse, onClose, gradePointScale }) => {
  const [newCourseInput, setNewCourseInput] = useState({ code: "", credits: "3", gp: "4.0" });

  const handleAdd = () => {
    const result = onAddCourse(newCourseInput);
    if (result !== false) onClose();
  };

  const stepGp = (direction) => {
    const next = getNextGradePoint(gradePointScale || [0, 4], newCourseInput.gp, direction);
    setNewCourseInput((prev) => ({ ...prev, gp: parseFloat(next).toFixed(1) }));
  };

  const inputCls =
    "mt-1 w-full px-3 py-2.5 text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <>
      {/* Backdrop — same as saved-routines mobile sheet */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      {/* Bottom sheet — identical chrome to the semester popup */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-250 ease-out flex flex-col overflow-hidden" style={{ maxHeight: "80vh", height: "auto" }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              Add Planned Course
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
              Simulate a future course to see its effect on CGPA
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 transition-colors shrink-0"
            aria-label="Close add course"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-2 pb-3 overscroll-contain" style={{ maxHeight: "calc(80vh - 7rem)" }}>
          <div className="px-2 py-2 flex items-center gap-3">
            {/* Course code — left */}
            <div className="flex-1 min-w-0">
              <label className="block text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Course Code
              </label>
              <input
                type="text"
                placeholder="CSE110"
                value={newCourseInput.code}
                onChange={(e) => setNewCourseInput((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className={`${inputCls} mt-1`}
                autoFocus
                autoCorrect="off"
              />
            </div>

            {/* Credits — right of code */}
            <div className="w-20 shrink-0">
              <label className="block text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Credits
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={newCourseInput.credits}
                onChange={(e) => setNewCourseInput((prev) => ({ ...prev, credits: e.target.value }))}
                className={`${inputCls} mt-1 w-full px-1 text-center font-mono`}
                min="0"
                max="10"
                step="0.5"
              />
            </div>

            {/* Grade points stepper — far right */}
            <div className="shrink-0">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block text-center">
                GP
              </label>
              <div className="mt-1 flex items-center">
                <button
                  type="button"
                  onClick={() => stepGp("down")}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Decrease grade points"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newCourseInput.gp}
                  onChange={(e) => setNewCourseInput((prev) => ({ ...prev, gp: e.target.value }))}
                  className={`w-12 px-0 py-2 text-base bg-transparent font-mono text-center appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none ${
                    newCourseInput.gp >= 3.5
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : newCourseInput.gp >= 2.8
                        ? "text-blue-600 dark:text-blue-400 font-bold"
                        : newCourseInput.gp > 0
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-red-600 dark:text-red-400 font-bold"
                  }`}
                  min="0"
                  max="4"
                  step="0.1"
                  aria-label="Grade points"
                />
                <button
                  type="button"
                  onClick={() => stepGp("up")}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation"
                  aria-label="Increase grade points"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-2 pb-1">
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-xl bg-blue-600 active:bg-blue-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Semester list + detail popup styled exactly like the Saved Routines page:
 * individual rounded-xl cards with a tinted icon square, and a blue View
 * button that opens the bottom-sheet modal (MergedRoutineModalWrapper style).
 */
export default function MobileCourseList({
  courses,
  semesterGroups,
  onUpdateGradePoints,
  onDeleteCourse,
  onResetGrades,
  onAddCourse,
  gradePointScale,
}) {
  const [openSemester, setOpenSemester] = useState(null); // group name or null
  const [addingCourse, setAddingCourse] = useState(false);

  const groupStats = (group) => {
    const credits = group.courses.reduce((sum, c) => sum + c.credits, 0);
    const qp = group.courses.reduce((sum, c) => sum + c.qualityPoints, 0);
    const gpa = credits > 0 ? qp / credits : 0;
    return { credits, gpa };
  };

  const activeGroup = openSemester ? semesterGroups.find((g) => g.name === openSemester) : null;
  const { credits: activeCredits, gpa: activeGpa } = activeGroup ? groupStats(activeGroup) : { credits: 0, gpa: 0 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Semesters <span className="ml-1 text-gray-400 font-medium">({semesterGroups.length})</span>
        </h2>
        <button
          onClick={onResetGrades}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Grades
        </button>
      </div>

      {/* Semester list — compact rows, tap to open the popup */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {semesterGroups.map((group) => {
            const { credits, gpa } = groupStats(group);
            return (
              <button
                key={group.name}
                onClick={() => setOpenSemester(group.name)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
                  <CalendarDays className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {formatSemesterName(group.name)}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    {group.courses.length} courses · {credits.toFixed(1)} cr
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shrink-0 ${
                    gpa >= 3.5
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                      : gpa >= 2.8
                        ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {gpa.toFixed(2)}
                  <span className="text-[10px] font-semibold opacity-80">GPA</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Add planned course */}
      <button
        onClick={() => setAddingCourse(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-gray-900/50 active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Planned Course
      </button>

      {addingCourse && <AddCourseForm onAddCourse={onAddCourse} onClose={() => setAddingCourse(false)} gradePointScale={gradePointScale} />}

      {/* Semester detail popup — saved-routines mobile bottom sheet */}
      {activeGroup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in-0 duration-200"
            onClick={() => setOpenSemester(null)}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-250 ease-out flex flex-col overflow-hidden" style={{ maxHeight: "80vh", height: "auto" }}>
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {formatSemesterName(activeGroup.name)}
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                  {activeGroup.courses.length} courses · {activeCredits.toFixed(2)} credits
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                    activeGpa >= 3.5
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                      : activeGpa >= 2.8
                        ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {activeGpa.toFixed(2)}
                  <span className="text-[10px] font-semibold opacity-80">GPA</span>
                </span>
                <button
                  onClick={() => setOpenSemester(null)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                  aria-label="Close semester"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-2 pb-4 overscroll-contain" style={{ maxHeight: "calc(80vh - 7rem)" }}>
              {activeGroup.courses.map((course) => (
                <CourseRow
                  key={`${course.courseCode}-${course.originalIndex}`}
                  course={course}
                  gradePointScale={gradePointScale}
                  onUpdateGradePoints={onUpdateGradePoints}
                  onDeleteCourse={onDeleteCourse}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
