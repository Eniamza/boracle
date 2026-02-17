'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SwapFilter = ({ courses = [], swaps = [], onFilterChange }) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-all flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        <span>Filter Swaps</span>
        {selectedCourses.length > 0 && (
          <Badge className="bg-white/20 text-white border-0">
            {selectedCourses.length}
          </Badge>
        )}
      </div>

      {open && (
        <div className="absolute z-[200] mt-2 w-80 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shadow-gray-400/30 dark:shadow-black/50" 
             style={{ maxHeight: '400px', overflow: 'hidden' }}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <Input
              placeholder="Search courses to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          {selectedCourses.length > 0 && (
            <div className="p-3 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Selected Filters ({selectedCourses.length})</span>
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCourses.map(sectionId => {
                  const course = getCourseBySection(sectionId);
                  return (
                    <Badge key={sectionId} className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0">
                      {course ? formatCourse(course) : `Section ${sectionId}`}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCourse(sectionId);
                        }}
                        className="ml-1.5 hover:text-red-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative">
            <div className="max-h-[250px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No courses found</div>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected = selectedCourses.includes(course.sectionId);
                  return (
                    <div
                      key={course.sectionId}
                      className={cn(
                        "flex items-center px-3 py-2.5 cursor-pointer transition-colors border-l-3",
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-950/40 border-l-blue-600 dark:border-l-blue-400" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 border-l-transparent"
                      )}
                      onClick={() => toggleCourse(course.sectionId)}
                    >
                      <div
                        className={cn(
                          "mr-3 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500" 
                            : "border-gray-300 dark:border-gray-600"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"
                        )}>{formatCourse(course)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {course.faculties || 'TBA'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Bottom fade gradient to indicate more content */}
            {filteredCourses.length > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapFilter;