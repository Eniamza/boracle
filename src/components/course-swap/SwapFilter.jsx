'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SwapFilter = ({ courses = [], swaps = [], onFilterChange, isMobile = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const dropdownRef = useRef(null);

  const formatCourse = (course) => {
    return `${course.courseCode}-[${course.sectionName}]`;
  };

  // Get unique courses from swaps
  const getAvailableCourses = () => {
    const sectionIds = new Set();
    swaps.forEach(swap => {
      if (swap.getSectionId) sectionIds.add(swap.getSectionId);
      if (swap.askingSections) {
        swap.askingSections.forEach(id => sectionIds.add(id));
      }
    });

    return courses.filter(course =>
      sectionIds.has(course.sectionId)
    );
  };

  const availableCourses = getAvailableCourses();

  const filterCourses = (searchTerm) => {
    if (!searchTerm) return availableCourses.slice(0, 50);

    const search = searchTerm.toLowerCase();
    return availableCourses.filter(course =>
      course.courseCode?.toLowerCase().includes(search) ||
      course.sectionName?.toLowerCase().includes(search) ||
      formatCourse(course).toLowerCase().includes(search)
    ).slice(0, 50);
  };

  const toggleCourse = (courseId) => {
    const newSelection = selectedCourses.includes(courseId)
      ? selectedCourses.filter(id => id !== courseId)
      : [...selectedCourses, courseId];

    setSelectedCourses(newSelection);
    onFilterChange(newSelection);
  };

  const clearFilters = () => {
    setSelectedCourses([]);
    onFilterChange([]);
    setSearch("");
  };

  const getCourseBySection = (sectionId) => {
    return courses.find(c => c.sectionId === parseInt(sectionId));
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

  // Handle mobile back gesture
  useEffect(() => {
    const handlePopState = () => {
      if (open) {
        setOpen(false);
      }
    };

    if (open) {
      // Add a dummy state to history when modal opens
      window.history.pushState({ modalOpen: true }, '');
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open]);

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-2 relative"
        title="Filter Swaps"
      >
        <Filter className="w-4 h-4" />

        {/* Desktop Content */}
        <div className="hidden md:flex items-center">
          <span>Filter Swaps</span>
          {selectedCourses.length > 0 && (
            <Badge className="bg-white/20 text-white border-0 ml-2">
              {selectedCourses.length}
            </Badge>
          )}
        </div>

        {/* Mobile Badge */}
        {selectedCourses.length > 0 && (
          <div className="md:hidden absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border border-white dark:border-gray-900">
            {selectedCourses.length}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-blue-800/50 rounded-lg max-w-md w-full shadow-xl z-[70] flex flex-col max-h-[70vh] md:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-blue-800/50 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter Swaps</h2>
                <p className="text-sm text-gray-500 dark:text-blue-300/70">Search and filter courses</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-blue-300" />
              </button>
            </div>

            {/* Content Segment */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 shrink-0 border-b border-gray-200 dark:border-gray-800">
                <Input
                  placeholder="Search courses to filter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 text-base"
                  autoFocus
                />
              </div>

              {/* Selected Categories */}
              {selectedCourses.length > 0 && (
                <div className="p-3 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Selected Filters ({selectedCourses.length})</span>
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCourses.map(sectionId => {
                      const course = getCourseBySection(sectionId);
                      return (
                        <Badge key={sectionId} className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 py-1 px-2.5">
                          {course ? formatCourse(course) : `Section ${sectionId}`}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCourse(sectionId);
                            }}
                            className="ml-1.5 hover:text-red-200 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Course List Scrollable */}
              <div className="relative flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-2">
                  {filteredCourses.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No matching courses found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCourses.map((course) => {
                        const isSelected = selectedCourses.includes(course.sectionId);
                        return (
                          <div
                            key={course.sectionId}
                            className={cn(
                              "flex items-center px-4 py-3 cursor-pointer transition-all rounded-lg border",
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent"
                            )}
                            onClick={() => toggleCourse(course.sectionId)}
                          >
                            <div
                              className={cn(
                                "mr-4 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                                  : "border-gray-300 dark:border-gray-600"
                              )}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-medium text-[15px] truncate",
                                isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"
                              )}>
                                {formatCourse(course)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {course.faculties || 'TBA'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Fade indicator for scroll */}
                {filteredCourses.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#0f172a] to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-blue-800/50 bg-gray-50 dark:bg-[#0c1629] shrink-0 rounded-b-lg">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium text-white flex justify-center items-center h-[42px]"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-white flex justify-center items-center h-[42px]"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwapFilter;