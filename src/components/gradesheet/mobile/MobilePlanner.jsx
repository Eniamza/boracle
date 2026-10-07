"use client";
import { GraduationCap } from "lucide-react";
import { clampTargetCgpa, clampTargetDegreeCredits } from "@/components/gradesheet/gradesheet-core";

export default function MobilePlanner({
  targetDegreeCredits, setTargetDegreeCredits,
  targetCgpaValue, setTargetCgpaValue,
  degreeCreditsNumber, targetCgpaNumber,
  remainingCredits, maxReachableCgpa,
  requiredAverageGpa, isTargetImpossible,
  gpaTolerance,
}) {
  const inputCls =
    "mt-1 w-full px-3.5 py-2.5 text-base rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Graduation Planner</h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total Credits
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="130"
              value={targetDegreeCredits}
              onChange={(e) => setTargetDegreeCredits(clampTargetDegreeCredits(e.target.value))}
              className={inputCls}
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Target CGPA
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="3.50"
              value={targetCgpaValue}
              onChange={(e) => setTargetCgpaValue(clampTargetCgpa(e.target.value))}
              className={inputCls}
              min="0"
              max="4"
              step="0.01"
            />
          </div>
        </div>

        {degreeCreditsNumber > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Left</div>
              <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">{remainingCredits.toFixed(0)}</div>
              <div className="text-[9px] text-gray-400">credits</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Max CGPA</div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{maxReachableCgpa.toFixed(2)}</div>
              <div className="text-[9px] text-gray-400">reachable</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Needed GPA</div>
              <div
                className={`text-lg font-bold font-mono ${
                  isTargetImpossible ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {isTargetImpossible ? "—" : requiredAverageGpa.toFixed(2)}
              </div>
              <div className="text-[9px] text-gray-400">per credit</div>
            </div>
          </div>
        )}

        {isTargetImpossible && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            That target isn&apos;t reachable — even all 4.0s won&apos;t get you there.
          </p>
        )}

        {gpaTolerance.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              You can afford…
            </div>
            <div className="space-y-2">
              {gpaTolerance.map(({ grade, count }) => {
                const severity = grade >= 3.0 ? "green" : grade >= 2.0 ? "amber" : "red";
                const colors = {
                  green: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400",
                  amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
                  red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
                }[severity];
                return (
                  <div key={grade} className={`flex items-center justify-between p-3 rounded-xl border ${colors}`}>
                    <span className="text-sm font-semibold font-mono">{count} × {grade.toFixed(1)}</span>
                    <span className="text-[11px] opacity-80">rest at 4.0</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {degreeCreditsNumber <= 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your total degree credits and target CGPA to see what grades you can still afford.
          </p>
        )}
      </div>
    </div>
  );
}
