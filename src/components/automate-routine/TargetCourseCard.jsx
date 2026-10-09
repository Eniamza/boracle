'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { seatInfo } from '@/lib/automate-routine/model';

const seatTone = (seatsLeft) => {
  if (seatsLeft === null) return null;
  if (seatsLeft === 0) return 'text-red-600 dark:text-red-400';
  if (seatsLeft <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

const CHIP_BASE =
  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500';
const CHIP_OFF =
  'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
const CHIP_ON =
  'course-selected bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300';

/**
 * One course the user wants scheduled, with its section and faculty narrowing.
 * "Any section" is the unfiltered default — the solver then considers every
 * section of the course that survives the global constraints.
 */
const TargetCourseCard = ({
  courseCode,
  courseName,
  rows,
  selectedIds = [],
  facultyPrefs = [],
  candidateCount = 0,
  onToggleSection,
  onClearSections,
  onToggleFaculty,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 10;

  const facultyOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      String(row.faculties ?? '')
        .split(',')
        .map((f) => f.trim().toUpperCase())
        .filter(Boolean)
        .forEach((f) => set.add(f));
    });
    return [...set].sort();
  }, [rows]);

  const hasSeatData = rows.some((row) => seatInfo(row).seatsLeft !== null);
  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const anySection = selectedIds.length === 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{courseCode}</h3>
            {rows[0]?.courseCredit != null && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{rows[0].courseCredit} cr</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{courseName}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${courseCode}`}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Sections
          </span>
          {rows.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {expanded ? 'Show fewer' : `Show all ${rows.length}`}
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={anySection}
            onClick={onClearSections}
            className={`${CHIP_BASE} ${anySection ? CHIP_ON : CHIP_OFF}`}
          >
            Any section
          </button>
          {visibleRows.map((row) => {
            const seat = seatInfo(row);
            const on = selectedIds.includes(row.sectionId);
            return (
              <button
                key={row.sectionId}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleSection(row.sectionId)}
                className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
              >
                {row.sectionName}
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">{row.faculties || 'TBA'}</span>
                {hasSeatData && seat.seatsLeft !== null && (
                  <span className={`ml-1 font-normal ${seatTone(seat.seatsLeft)}`}>
                    {seat.seatsLeft === 0 ? 'full' : `${seat.seatsLeft} left`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {facultyOptions.length > 1 && (
        <div className="mt-3">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Preferred faculty
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facultyOptions.map((code) => {
              const on = facultyPrefs.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggleFaculty(code)}
                  className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {candidateCount === 0 && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <span aria-hidden="true">&#9888;</span>
          Nothing left to schedule here after these choices and the constraints below.
        </p>
      )}
    </div>
  );
};

export default TargetCourseCard;
