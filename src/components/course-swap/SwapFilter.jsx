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
        <div className="absolute z-[200] mt-2 w-80 rounded-lg border bg-white dark:bg-gray-950 shadow-xl" 
             style={{ maxHeight: '400px', overflow: 'hidden' }}>
          <div className="p-3 border-b">
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
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected Filters</span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedCourses.map(sectionId => {
                  const course = getCourseBySection(sectionId);
                  return (
                    <Badge key={sectionId} variant="secondary" className="text-xs">
                      {course ? formatCourse(course) : `Section ${sectionId}`}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCourse(sectionId);
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="max-h-[250px] overflow-y-auto">
            {filteredCourses.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No courses found</div>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = selectedCourses.includes(course.sectionId);
                return (
                  <div
                    key={course.sectionId}
                    className={cn(
                      "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                      isSelected && "bg-purple-50 dark:bg-purple-950/20"
                    )}
                    onClick={() => toggleCourse(course.sectionId)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-purple-600",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{formatCourse(course)}</div>
                      <div className="text-xs text-gray-500">
                        {course.faculties || 'TBA'}
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
  );
};

export default SwapFilter;