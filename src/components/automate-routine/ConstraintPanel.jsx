'use client';

import React, { useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DAY_ORDER } from '@/lib/automate-routine/model';

const SHORT_DAYS = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

const CHIP_BASE =
  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500';
const CHIP_OFF =
  'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
const CHIP_ON =
  'bg-red-600 border-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700';

const DayStepper = ({ label, value, min, max, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

/**
 * Global constraints. Avoid-day / avoid-slot / avoid-faculty remove sections from the
 * candidate pools before the search runs, so they can empty a course entirely — the
 * page surfaces that, never this component.
 */
const ConstraintPanel = ({ constraints, onChange, slotLabels = [], facultyOptions = [], showSeatToggle = false }) => {
  const [facultySearch, setFacultySearch] = useState('');
  const [showAllFaculty, setShowAllFaculty] = useState(false);

  const toggleIn = (key, value) => {
    const list = constraints[key] || [];
    onChange({
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
  };

  const filteredFaculty = useMemo(() => {
    const term = facultySearch.trim().toUpperCase();
    const list = term ? facultyOptions.filter((f) => f.includes(term)) : facultyOptions;
    const avoid = constraints.avoidFaculty || [];
    // Chosen ones always stay visible, otherwise removing them would be a hunt.
    const merged = [...new Set([...avoid, ...list])];
    return merged.slice(0, showAllFaculty || term ? merged.length : 12);
  }, [facultyOptions, facultySearch, constraints.avoidFaculty, showAllFaculty]);

  const activeAvoidCount =
    (constraints.avoidDays?.length || 0) +
    (constraints.avoidSlots?.length || 0) +
    (constraints.avoidFaculty?.length || 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Constraints
        </h3>
        {activeAvoidCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({ avoidDays: [], avoidSlots: [], avoidFaculty: [] })}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            Clear {activeAvoidCount} avoidance{activeAvoidCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Avoid days
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAY_ORDER.map((day) => {
            const on = (constraints.avoidDays || []).includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => toggleIn('avoidDays', day)}
                className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
              >
                {SHORT_DAYS[day]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Avoid time slots
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {slotLabels.map((slot) => {
            const on = (constraints.avoidSlots || []).includes(slot);
            return (
              <button
                key={slot}
                type="button"
                aria-pressed={on}
                onClick={() => toggleIn('avoidSlots', slot)}
                className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {facultyOptions.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Avoid faculty
          </span>
          <input
            type="text"
            value={facultySearch}
            onChange={(e) => setFacultySearch(e.target.value)}
            placeholder="Search initials..."
            aria-label="Search faculty to avoid"
            className="mt-2 w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filteredFaculty.map((code) => {
              const on = (constraints.avoidFaculty || []).includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleIn('avoidFaculty', code)}
                  className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {on && <X className="inline w-3 h-3 mr-1 -mt-0.5" />}
                  {code}
                </button>
              );
            })}
            {!filteredFaculty.length && (
              <span className="text-xs text-gray-500 dark:text-gray-400">No faculty among these courses.</span>
            )}
          </div>
          {facultyOptions.length > 12 && !facultySearch && (
            <button
              type="button"
              onClick={() => setShowAllFaculty((v) => !v)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {showAllFaculty ? 'Show fewer' : `Show all ${facultyOptions.length}`}
            </button>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid gap-3 sm:grid-cols-2">
        <DayStepper
          label="Minimum days"
          value={constraints.minDays}
          min={1}
          max={6}
          onChange={(minDays) => onChange({ minDays, maxDays: Math.max(minDays, constraints.maxDays) })}
        />
        <DayStepper
          label="Maximum days"
          value={constraints.maxDays}
          min={1}
          max={6}
          onChange={(maxDays) => onChange({ maxDays, minDays: Math.min(maxDays, constraints.minDays) })}
        />
      </div>

      {showSeatToggle && (
        <label className="mt-4 flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Skip sections that are full
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Seat counts come from this semester&apos;s snapshot
            </span>
          </span>
          <Switch
            checked={!!constraints.excludeKnownFull}
            onCheckedChange={(excludeKnownFull) => onChange({ excludeKnownFull })}
          />
        </label>
      )}
    </div>
  );
};

export default ConstraintPanel;
