'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * Compact multi-select with an in-panel search. The app ships no Select/Popover
 * primitive, so this follows the same hand-rolled dropdown pattern PrePreReg uses
 * (button + absolute panel, outside click and Escape close).
 *
 * @param {Array<{value: string, label: string, note?: string, tone?: string}>} options
 */
const MultiSelectDropdown = ({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Any',
  anyLabel = 'Any',
  searchableAt = 8,
}) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    if (open && options.length >= searchableAt) inputRef.current?.focus();
  }, [open, options.length, searchableAt]);

  const visible = useMemo(() => {
    const q = term.trim().toUpperCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.note || ''}`.toUpperCase().includes(q));
  }, [options, term]);

  const selectedSet = new Set(selected);
  const chosen = options.filter((o) => selectedSet.has(o.value));

  const summary = () => {
    if (!chosen.length) return placeholder;
    if (chosen.length === 1) return chosen[0].label;
    if (chosen.length <= 3) return chosen.map((o) => o.label).join(', ');
    return `${chosen.length} selected`;
  };

  const toggle = (value) => {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full h-10 px-3 rounded-lg border text-sm flex items-center justify-between gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
          chosen.length
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <span className="min-w-0 truncate">
          <span className="text-gray-500 dark:text-gray-400">{label}: </span>
          {summary()}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={!chosen.length}
              className={`text-xs font-medium ${
                chosen.length
                  ? 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  : 'text-blue-700 dark:text-blue-300 pointer-events-none'
              }`}
            >
              {chosen.length ? `Clear (${chosen.length})` : anyLabel}
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">{options.length} total</span>
          </div>

          {options.length >= searchableAt && (
            <div className="relative px-2 pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Filter..."
                aria-label={`Filter ${label}`}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1">
            {visible.map((option) => {
              const on = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(option.value)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                      on ? 'bg-blue-600 border-blue-600' : 'border-gray-400 dark:border-gray-600'
                    }`}
                  >
                    {on && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{option.label}</span>
                  {option.note && (
                    <span className={`shrink-0 text-xs ${option.tone || 'text-gray-500 dark:text-gray-400'}`}>{option.note}</span>
                  )}
                </button>
              );
            })}
            {!visible.length && (
              <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">Nothing here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
