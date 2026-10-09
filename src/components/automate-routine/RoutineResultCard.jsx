'use client';

import React from 'react';
import { Download, Eye, Save } from 'lucide-react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';

export const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const Metric = ({ children, tone }) => (
  <span className={`text-sm ${tone || 'text-gray-700 dark:text-gray-300'}`}>{children}</span>
);

const Dot = () => <span className="text-xs text-gray-400 dark:text-gray-500">&middot;</span>;

/**
 * One generated routine, drawn with the same grid as the rest of the app
 * (RoutineView / PrePreReg use this component too), plus the metrics that explain
 * its rank. Handlers receive this card's routine so the parent can keep stable
 * callbacks and skip re-rendering 40 live grids on every keystroke.
 */
const RoutineResultCard = React.memo(({
  routine,
  courses,
  rank,
  showSeats = false,
  saving = false,
  onPreview,
  onAdopt,
  onSave,
}) => {
  const seats = routine.seatsLeft;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {rank != null && (
          <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">#{rank}</span>
        )}
        <Metric tone="text-blue-700 dark:text-blue-300 font-medium">
          {routine.days} {routine.days === 1 ? 'day' : 'days'} on campus
        </Metric>
        <Dot />
        <Metric>{formatMinutes(routine.spanMinutes)} span</Metric>
        <Dot />
        <Metric>{formatMinutes(routine.contactMinutes)} of class</Metric>
        <Dot />
        <Metric>{routine.credits} cr</Metric>
        {showSeats && seats !== null && (
          <>
            <Dot />
            <Metric tone={seats === 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {seats} seats left
            </Metric>
          </>
        )}
      </div>

      {/* Same grid at every breakpoint (forceDesktop is how RoutinePeek/RoutineView ask
          for this). On a phone the table is wider than the screen, so it pans instead of
          crushing seven day columns into 340px. */}
      <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="min-w-[560px]">
          <RoutineTableGrid selectedCourses={courses} compact showRemoveButtons={false} forceDesktop />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreview(routine, rank)}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => onAdopt(routine)}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          Load into PrePreReg
        </button>
        <button
          type="button"
          onClick={() => onSave(routine)}
          disabled={saving}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save routine'}
        </button>
      </div>
    </div>
  );
});

RoutineResultCard.displayName = 'RoutineResultCard';

export default RoutineResultCard;
