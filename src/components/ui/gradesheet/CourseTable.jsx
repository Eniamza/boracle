import { Fragment, useState } from "react";
import { Plus, RotateCcw, Trash2, CheckCircle2, X } from "lucide-react";
import { formatSemesterName } from "./gradesheet-utils";

const getNextGradePoint = (gradePointScale, currentValue, direction) => {
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

export default function CourseTable({ 
  courses, 
  semesterGroups, 
  onUpdateGradePoints, 
  onDeleteCourse, 
  onResetGrades, 
  onAddCourse,
  gradePointScale
}) {
  const [addingCourse, setAddingCourse] = useState(false);
  const [newCourseInput, setNewCourseInput] = useState({ code: "", credits: "3.00", gp: "4.00" });

  const handleAddCourse = () => {
    const result = onAddCourse(newCourseInput);
    if (result !== false) {
      setAddingCourse(false);
      setNewCourseInput({ code: "", credits: "3.00", gp: "4.00" });
    }
  };

  const handleGradePointStepper = (event, originalIndex, currentValue) => {
    const spinnerZone = 28;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.right - spinnerZone) return;

    const midY = rect.top + rect.height / 2;
    const isUp = event.clientY < midY;
    event.preventDefault();

    const nextValue = getNextGradePoint(gradePointScale, currentValue, isUp ? "up" : "down");
    event.currentTarget.value = nextValue;
    onUpdateGradePoints(originalIndex, nextValue);
  };

  const handleGradePointKeyDown = (event, originalIndex, currentValue) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const nextValue = getNextGradePoint(gradePointScale, currentValue, event.key === "ArrowUp" ? "up" : "down");
    event.currentTarget.value = nextValue;
    onUpdateGradePoints(originalIndex, nextValue);
  };

  const handleNewCourseGpaStepper = (event) => {
    const spinnerZone = 28;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.right - spinnerZone) return;

    const midY = rect.top + rect.height / 2;
    const isUp = event.clientY < midY;
    event.preventDefault();

    const nextValue = getNextGradePoint(gradePointScale, newCourseInput.gp, isUp ? "up" : "down");
    setNewCourseInput((prev) => ({ ...prev, gp: nextValue }));
    event.currentTarget.value = nextValue;
  };

  const handleNewCourseGpaKeyDown = (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const nextValue = getNextGradePoint(gradePointScale, newCourseInput.gp, event.key === "ArrowUp" ? "up" : "down");
    setNewCourseInput((prev) => ({ ...prev, gp: nextValue }));
    event.currentTarget.value = nextValue;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Courses List <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">{courses.length}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust grade points to see how it affects your CGPA.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/30">
              <th className="px-5 md:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Course</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Credits</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Grade Pts</th>
              <th className="px-3 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {semesterGroups.map((group) => (
              <Fragment key={group.name}>
                <tr className="bg-blue-50/40 dark:bg-blue-900/20 border-y border-gray-100 dark:border-gray-800">
                  <td colSpan="4" className="px-5 md:px-6 py-2.5 text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    {formatSemesterName(group.name)}
                  </td>
                </tr>
                {group.courses.map((course) => (
                  <tr key={`${course.courseCode}-${course.originalIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 md:px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        {course.courseCode}
                        {course.isRetake && <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{course.retakeType || "RT"}</span>}
                        {course.isFailed && <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">F</span>}
                        {course.isManuallyAdded && <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Manual</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums font-mono">{course.credits.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <input type="number" className="w-20 px-2.5 py-1.5 text-sm text-center rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 tabular-nums font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" defaultValue={course.gradePoints.toFixed(1)} min="0" max="4" step="0.1" onBlur={(e) => onUpdateGradePoints(course.originalIndex, e.target.value)} onPointerDown={(e) => handleGradePointStepper(e, course.originalIndex, course.gradePoints)} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); else handleGradePointKeyDown(e, course.originalIndex, course.gradePoints); }} id={`grade-input-${course.originalIndex}`} />
                    </td>
                    <td className="px-3 py-3.5">
                      <button onClick={() => onDeleteCourse(course.originalIndex)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete" id={`del-${course.originalIndex}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {addingCourse && (
              <tr className="bg-blue-50/30 dark:bg-blue-900/10 border-t border-gray-100 dark:border-gray-800">
                <td className="px-5 md:px-6 py-3.5"><input type="text" placeholder="CSE110" value={newCourseInput.code} onChange={(e) => setNewCourseInput((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} className="w-full max-w-[110px] px-2.5 py-1.5 text-sm rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30" autoFocus id="new-code" /></td>
                <td className="px-4 py-3.5"><input type="number" value={newCourseInput.credits} onChange={(e) => setNewCourseInput((prev) => ({ ...prev, credits: e.target.value }))} className="w-20 px-2.5 py-1.5 text-sm text-center rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30" min="0" max="10" step="0.5" id="new-cr" /></td>
                <td className="px-4 py-3.5"><input type="number" value={newCourseInput.gp} onChange={(e) => setNewCourseInput((prev) => ({ ...prev, gp: e.target.value }))} onPointerDown={handleNewCourseGpaStepper} onKeyDown={handleNewCourseGpaKeyDown} className="w-20 px-2.5 py-1.5 text-sm text-center rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30" min="0" max="4" step="0.1" id="new-gp" /></td>
                <td className="px-3 py-3.5">
                  <div className="flex gap-1.5">
                    <button onClick={handleAddCourse} className="p-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm" id="save-new"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => setAddingCourse(false)} className="p-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" id="cancel-new"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="px-5 md:px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex gap-3 flex-wrap">
        <button onClick={() => setAddingCourse(true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20" id="add-course-btn">
          <Plus className="w-4 h-4" /> Add Course
        </button>
        <button onClick={onResetGrades} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm" id="reset-btn">
          <RotateCcw className="w-4 h-4" /> Reset Grades
        </button>
      </div>
    </div>
  );
}
