'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MultiCourseSelector = ({ label, courses = [], values = [], onChange, placeholder, excludeSectionId }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const formatCourse = (course) => {
    return `${course.courseCode}-[${course.sectionName}]`;
  };

  // Filter out the excluded section (the one being offered)
  const availableCourses = excludeSectionId 
    ? courses.filter(c => c.sectionId?.toString() !== excludeSectionId)
    : courses;

  const filterCourses = (searchTerm) => {
    if (!availableCourses || availableCourses.length === 0) return [];
    if (!searchTerm) return availableCourses.slice(0, 50);
    
    const search = searchTerm.toLowerCase();
    return availableCourses.filter(course => 
      course.courseCode?.toLowerCase().includes(search) ||
      course.sectionName?.toLowerCase().includes(search) ||
      formatCourse(course).toLowerCase().includes(search)
    ).slice(0, 50);
  };

  const toggleSection = (sectionId) => {
    if (values.includes(sectionId)) {
      onChange(values.filter(id => id !== sectionId));
    } else {
      onChange([...values, sectionId]);
    }
  };

  const getCourseBySection = (sectionId) => {
    return courses.find(c => c.sectionId?.toString() === sectionId);
  };

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
          className="w-full min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-between text-gray-900 dark:text-gray-100"
        >
          {values.length > 0 ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {values.map(sectionId => {
                const course = getCourseBySection(sectionId);
                return (
                  <span
                    key={sectionId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/50 rounded-full text-sm text-blue-700 dark:text-blue-300"
                  >
                    {course ? formatCourse(course) : `Section ${sectionId}`}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(sectionId);
                      }}
                      className="ml-1 hover:text-blue-500 dark:hover:text-blue-200 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 flex-1">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </div>
        
        {open && (
          <div className="absolute z-[200] mt-2 w-full rounded-lg border border-gray-200 dark:border-blue-700/50 bg-white dark:bg-[#0f172a] shadow-xl" 
               style={{ maxHeight: '300px', overflow: 'hidden' }}>
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
            <div className="max-h-[240px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-blue-300/70">No course found.</div>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected = values.includes(course.sectionId?.toString());
                  return (
                    <div
                      key={course.sectionId}
                      className={cn(
                        "flex items-center px-3 py-2.5 cursor-pointer transition-colors text-gray-900 dark:text-white",
                        isSelected 
                          ? "bg-blue-100 dark:bg-blue-800/40" 
                          : "hover:bg-gray-100 dark:hover:bg-[#1e3a5f]"
                      )}
                      onClick={() => toggleSection(course.sectionId?.toString())}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-blue-600 dark:text-blue-400",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{formatCourse(course)}</div>
                        <div className="text-xs text-gray-500 dark:text-blue-300/70">
                          {course.faculties || 'TBA'} • Seats: {course.capacity - course.consumedSeat}/{course.capacity}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiCourseSelector;