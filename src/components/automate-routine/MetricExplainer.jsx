'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatMinutes } from '@/components/automate-routine/RoutineResultCard';
import { DAY_ORDER } from '@/lib/automate-routine/model';

/**
 * Metric item with coffee branding and an interactive popover explanation
 * that triggers on both hover (desktop) and tap (mobile).
 */
const MetricExplainer = ({
  type, // 'span' | 'class'
  label, // e.g. "20h 10m span"
  value, // minutes
  dailySpans = {},
  spanMinutes = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('touchstart', handleDocClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('touchstart', handleDocClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeDailyList = useMemo(() => {
    if (!dailySpans) return [];
    return DAY_ORDER.filter((day) => (dailySpans[day] || 0) > 0).map((day) => ({
      day: day.charAt(0) + day.slice(1).toLowerCase(),
      abbr: day.slice(0, 3),
      span: dailySpans[day],
    }));
  }, [dailySpans]);

  const breakMinutes = spanMinutes > value ? spanMinutes - value : 0;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="text-sm font-semibold tabular-nums text-[#6F3E1B] dark:text-[#D48B55] underline decoration-dotted decoration-[#6F3E1B]/60 dark:decoration-[#D48B55]/60 underline-offset-4 hover:decoration-[#6F3E1B] dark:hover:decoration-[#D48B55] hover:text-[#522c12] dark:hover:text-[#f0ad7d] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F3E1B]/40 rounded-sm"
      >
        {label}
      </button>

      {isOpen && (
        <div
          role="dialog"
          className="absolute z-50 bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 w-64 sm:w-72 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {type === 'span' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-1.5">
                <span className="font-semibold text-xs text-[#6F3E1B] dark:text-[#D48B55]">
                  Campus Span
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#6F3E1B]/10 dark:bg-[#D48B55]/15 text-[#6F3E1B] dark:text-[#D48B55]">
                  {formatMinutes(value)} total
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Total elapsed time on campus across the week — measured from the start of your first
                class to the end of your last class each day, including wait periods between classes.
              </p>
              {activeDailyList.length > 0 && (
                <div className="pt-1.5 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Daily breakdown:
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {activeDailyList.map(({ day, span }) => (
                      <div
                        key={day}
                        className="flex items-center justify-between px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                      >
                        <span className="opacity-75">{day}:</span>
                        <span className="font-medium text-[#6F3E1B] dark:text-[#D48B55]">
                          {formatMinutes(span)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                A tighter span means fewer awkward gaps between classes.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-1.5">
                <span className="font-semibold text-xs text-[#6F3E1B] dark:text-[#D48B55]">
                  Class Duration
                </span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#6F3E1B]/10 dark:bg-[#D48B55]/15 text-[#6F3E1B] dark:text-[#D48B55]">
                  {formatMinutes(value)} total
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                The actual time you spend sitting in lectures and labs each week, excluding any gaps
                or free periods.
              </p>
              {breakMinutes > 0 && (
                <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-700/50 text-[11px] text-gray-700 dark:text-gray-200 flex items-center justify-between">
                  <span className="opacity-75">Weekly break / gap time:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatMinutes(breakMinutes)}
                  </span>
                </div>
              )}
              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                Span minus Class time = your total free time between classes.
              </div>
            </div>
          )}

          {/* Pointer caret */}
          <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-full -mt-1 w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default MetricExplainer;
