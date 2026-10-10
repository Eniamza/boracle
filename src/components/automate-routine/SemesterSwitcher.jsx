'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import globalInfo from '@/constants/globalInfo';

/**
 * Semester switcher with the exact live/past language used in PrePreReg:
 * emerald for the current semester, amber for frozen CDN backups.
 */
const SemesterSwitcher = ({ selectedSemester, pastSemesters = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isCurrent = selectedSemester === 'current';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`h-[50px] px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium whitespace-nowrap border ${
          isCurrent
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isCurrent ? `Current (${globalInfo.semester})` : selectedSemester.replace(/([A-Z])/g, ' $1').trim()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChange('current');
              setOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              isCurrent
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div className="flex flex-col items-start">
              <span>{globalInfo.semester}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Live &middot; Current Semester</span>
            </div>
          </button>

          {pastSemesters.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                Past Semesters
              </div>
              {pastSemesters.map((backup) => (
                <button
                  key={backup.semester}
                  type="button"
                  onClick={() => {
                    onChange(backup.semester);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    selectedSemester === backup.semester
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedSemester === backup.semester ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <div className="flex flex-col items-start">
                    <span>{backup.semester.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {backup.totalSections != null && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{backup.totalSections} sections</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SemesterSwitcher;
