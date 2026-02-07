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
      <label className="text-sm font-medium">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="w-full min-h-[40px] px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
        >
          {values.length > 0 ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {values.map(sectionId => {
                const course = getCourseBySection(sectionId);
                return (
                  <span
                    key={sectionId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm"
                  >
                    {course ? formatCourse(course) : `Section ${sectionId}`}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(sectionId);
                      }}
                      className="ml-1 hover:text-red-500 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-gray-500 flex-1">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
        
        {open && (
          <div className="absolute z-[200] mt-2 w-full rounded-md border bg-white dark:bg-gray-950 shadow-lg" 
               style={{ maxHeight: '300px', overflow: 'hidden' }}>
            <div className="p-2 border-b">
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No course found.</div>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected = values.includes(course.sectionId?.toString());
                  return (
                    <div
                      key={course.sectionId}
                      className={cn(
                        "flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                        isSelected && "bg-gray-100 dark:bg-gray-800"
                      )}
                      onClick={() => toggleSection(course.sectionId?.toString())}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{formatCourse(course)}</div>
                        <div className="text-xs text-gray-500">
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