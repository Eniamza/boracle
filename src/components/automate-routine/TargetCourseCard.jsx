'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import MultiSelectDropdown from '@/components/automate-routine/MultiSelectDropdown';
import { seatInfo } from '@/lib/automate-routine/model';

const seatTone = (seatsLeft) => {
  if (seatsLeft === null) return undefined;
  if (seatsLeft === 0) return 'text-red-600 dark:text-red-400';
  if (seatsLeft <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

/**
 * One course the user wants scheduled. "Any section" is the unfiltered default — the
 * solver then considers every section of the course that survives the constraints.
 */
const TargetCourseCard = ({
  courseCode,
  courseName,
  rows,
  selectedIds = [],
  facultyPrefs = [],
  candidateCount = 0,
  onToggleSection,
  onSectionsChange,
  onFacultiesChange,
  onRemove,
}) => {
  const hasSeatData = useMemo(() => rows.some((row) => seatInfo(row).seatsLeft !== null), [rows]);

  const sectionOptions = useMemo(
    () =>
      rows.map((row) => {
        const seat = seatInfo(row);
        const parts = [row.faculties || 'TBA'];
        if (hasSeatData && seat.seatsLeft !== null) {
          parts.push(seat.seatsLeft === 0 ? 'full' : `${seat.seatsLeft} left`);
        }
        return {
          value: row.sectionId,
          label: `${row.sectionName}`,
          note: parts.join(' · '),
          tone: hasSeatData && seat.seatsLeft === 0 ? 'text-red-600 dark:text-red-400' : undefined,
        };
      }),
    [rows, hasSeatData]
  );

  const facultyOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      String(row.faculties ?? '')
        .split(',')
        .map((f) => f.trim().toUpperCase())
        .filter(Boolean)
        .forEach((f) => set.add(f));
    });
    return [...set].sort().map((code) => ({ value: code, label: code }));
  }, [rows]);

  // Selected ids that no longer exist in the catalog (semester switch, section dropped).
  const liveSelectedIds = useMemo(() => {
    const known = new Set(rows.map((r) => r.sectionId));
    return selectedIds.filter((id) => known.has(id));
  }, [rows, selectedIds]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{courseCode}</h3>
            {rows[0]?.courseCredit != null && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{rows[0].courseCredit} cr</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">{rows.length} sections</span>
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

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MultiSelectDropdown
          label="Sections"
          placeholder="Any section"
          anyLabel="Any section"
          options={sectionOptions}
          selected={liveSelectedIds}
          onChange={onSectionsChange}
        />
        <MultiSelectDropdown
          label="Faculty"
          placeholder="Any faculty"
          anyLabel="Any faculty"
          options={facultyOptions}
          selected={facultyPrefs}
          onChange={onFacultiesChange}
          searchableAt={10}
        />
      </div>

      {candidateCount === 0 && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <span aria-hidden="true">&#9888;</span>
          Nothing left to schedule here after these choices and the constraints on the right.
        </p>
      )}
    </div>
  );
};

export default TargetCourseCard;
