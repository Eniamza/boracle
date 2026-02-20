'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CourseSelector = ({ label, courses = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const formatCourse = (course) => {
    return `${course.courseCode}-[${course.sectionName}]`;
  };

  const filterCourses = (searchTerm) => {
    if (!courses || courses.length === 0) return [];
    if (!searchTerm) return courses.slice(0, 50);

    const search = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.courseCode?.toLowerCase().includes(search) ||
      course.sectionName?.toLowerCase().includes(search) ||
      formatCourse(course).toLowerCase().includes(search)
    ).slice(0, 50);
  };

  const selectedCourse = courses.find(c => c.sectionId?.toString() === value);
  const filteredCourses = filterCourses(search);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-blue-200">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-between text-gray-900 dark:text-gray-100"
        >
          {selectedCourse ? (
            <span>{formatCourse(selectedCourse)}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </div>

        {open && (
          <div className="absolute z-[200] mt-2 w-full rounded-lg border border-gray-200 dark:border-blue-700/50 bg-white dark:bg-[#0f172a] shadow-xl"
            style={{ maxHeight: '320px', overflow: 'hidden' }}>
            <div className="p-2 border-b border-gray-200 dark:border-blue-800/50">
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-[260px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-blue-300/70">No course found.</div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.sectionId}
                    className={cn(
                      "flex items-center px-3 py-2.5 cursor-pointer transition-colors text-gray-900 dark:text-white",
                      value === course.sectionId?.toString()
                        ? "bg-blue-100 dark:bg-blue-800/40"
                        : "hover:bg-gray-100 dark:hover:bg-[#1e3a5f]"
                    )}
                    onClick={() => {
                      onChange(course.sectionId?.toString());
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-blue-600 dark:text-blue-400",
                        value === course.sectionId?.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{formatCourse(course)}</div>
                      <div className="text-xs text-gray-500">
                        {course.faculties || 'TBA'} • Seats: {course.capacity - course.consumedSeat}/{course.capacity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelector;