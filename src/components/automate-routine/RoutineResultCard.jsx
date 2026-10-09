'use client';

import React from 'react';
import { Download, Eye, Save } from 'lucide-react';
import { seatInfo } from '@/lib/automate-routine/model';

const SHORT_DAYS = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

export const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const PILL =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';

/**
 * One generated routine. Metrics are the solver's own: days touched, campus span
 * (earliest to latest class per day, summed), contact time and credits.
 */
const RoutineResultCard = ({ rank, routine, onPreview, onAdopt, onSave, isSaving = false, showSeats = false }) => {
  const seats = routine.seatsLeft;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {rank != null && (
          <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">#{rank}</span>
        )}
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {routine.days} {routine.days === 1 ? 'day' : 'days'} on campus
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">&middot;</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{formatMinutes(routine.spanMinutes)} span</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">&middot;</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{formatMinutes(routine.contactMinutes)} of class</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">&middot;</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{routine.credits} cr</span>
        {showSeats && seats !== null && (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400">&middot;</span>
            <span className={`text-sm ${seats === 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {seats} seats left
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {routine.sections.map((section) => {
          const seat = seatInfo(section);
          return (
            <span key={section.sectionId} className={PILL}>
              {section.courseCode}-[{section.sectionName}]
              <span className="text-gray-500 dark:text-gray-400">{section.faculties || 'TBA'}</span>
              {showSeats && seat.seatsLeft !== null && (
                <span className={seat.seatsLeft === 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {seat.seatsLeft}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{(routine.daysList || []).map((d) => SHORT_DAYS[d] || d).join(' ')}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={onAdopt}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          Load into PrePreReg
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save routine'}
        </button>
      </div>
    </div>
  );
};

export default RoutineResultCard;
