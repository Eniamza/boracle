'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, Plus, Calendar, Clock, X, Users, BookOpen, Download, Save, AlertCircle, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import ExportRoutinePNG from '@/components/routine/ExportRoutinePNG';
import { toast } from 'sonner';



import { useLocalStorage } from '@/hooks/use-local-storage';

const PreRegistrationPage = () => {
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [selectedCourses, setSelectedCourses] = useLocalStorage('boracle_selected_courses', []); // Changed to useLocalStorage
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [creditLimitWarning, setCreditLimitWarning] = useState(false);
  const [customToast, setCustomToast] = useState({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({
    hideFilled: false,
    avoidFaculties: []
  });
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDropdownOpen, setFacultyDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(50);
  const [facultyMap, setFacultyMap] = useState({});
  const [hoveredFaculty, setHoveredFaculty] = useState(null);
  const [facultyTooltipPosition, setFacultyTooltipPosition] = useState({ x: 0, y: 0 });
  const [facultyImageError, setFacultyImageError] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const observerRef = useRef();
  const lastCourseRef = useRef();
  const routineRef = useRef(null);
  const facultyDropdownRef = useRef(null);
  const facultyListRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // Helper to get faculty details for a course
  const getFacultyDetails = useCallback((faculties) => {
    if (!faculties) return { facultyName: null, facultyEmail: null, imgUrl: null };

    // Get the first initial from the faculties string
    const firstInitial = faculties.split(',')[0]?.trim().toUpperCase();
    const facultyInfo = facultyMap[firstInitial];

    if (facultyInfo) {
      return {
        facultyName: facultyInfo.facultyName,
        facultyEmail: facultyInfo.email,
        imgUrl: facultyInfo.imgUrl,
      };
    }
    return { facultyName: null, facultyEmail: null, imgUrl: null };
  }, [facultyMap]);

  // Enrich selected courses with faculty details
  const enrichedSelectedCourses = useMemo(() => {
    return selectedCourses.map(course => {
      const { facultyName, facultyEmail } = getFacultyDetails(course.faculties);
      return {
        ...course,
        employeeName: facultyName,
        employeeEmail: facultyEmail,
      };
    });
  }, [selectedCourses, getFacultyDetails]);

  // Extract unique faculty initials from CDN courses data
  const cdnFacultyList = useMemo(() => {
    const facultySet = new Set();
    courses.forEach(course => {
      if (course.faculties) {
        // Split by comma in case there are multiple faculties
        course.faculties.split(',').forEach(f => {
          const initial = f.trim().toUpperCase();
          if (initial && initial !== 'TBA') {
            facultySet.add(initial);
          }
        });
      }
    });
    return Array.from(facultySet).sort();
  }, [courses]);

  // Calculate total credits
  const totalCredits = useMemo(() => {
    return selectedCourses.reduce((sum, course) => sum + (course.courseCredit || 0), 0);
  }, [selectedCourses]);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
        const data = await response.json();
        // Sort courses by course code and section name
        data.sort((a, b) => {
          const codeA = a.courseCode || '';
          const codeB = b.courseCode || '';
          const sectionA = a.sectionName || '';
          const sectionB = b.sectionName || '';

          if (codeA < codeB) return -1;
          if (codeA > codeB) return 1;
          if (sectionA < sectionB) return -1;
          if (sectionA > sectionB) return 1;
          return 0;
        });

        // Set courses immediately so UI loads
        setCourses(data);
        setFilteredCourses(data);
        setLoading(false);

        // Fetch all faculty data in the background (single query, non-blocking)
        fetch('/api/faculty/lookup')
          .then(res => res.json())
          .then(facultyData => {
            if (facultyData.success) {
              setFacultyMap(facultyData.facultyMap);
            }
          })
          .catch(err => console.error('Error fetching faculty data:', err));
      } catch (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...courses];

    // Apply search
    if (debouncedSearchTerm) {
      filtered = filtered.filter(course =>
        course.courseCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.faculties?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.sectionName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.hideFilled) {
      filtered = filtered.filter(course =>
        course.capacity > course.consumedSeat
      );
    }

    if (filters.avoidFaculties.length > 0) {
      filtered = filtered.filter(course =>
        !filters.avoidFaculties.some(faculty =>
          course.faculties?.toLowerCase().includes(faculty.toLowerCase())
        )
      );
    }

    setFilteredCourses(filtered);
    setDisplayCount(50);
  }, [debouncedSearchTerm, courses, filters]);

  // Update displayed courses when filtered courses or display count changes
  useEffect(() => {
    setDisplayedCourses(filteredCourses.slice(0, displayCount));
  }, [filteredCourses, displayCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || displayCount >= filteredCourses.length) return;

    const currentRef = lastCourseRef.current;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting && displayCount < filteredCourses.length) {
          console.log('Loading more courses...', { current: displayCount, total: filteredCourses.length });
          setDisplayCount(prev => {
            const newCount = Math.min(prev + 50, filteredCourses.length);
            console.log('New display count:', newCount);
            return newCount;
          });
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [loading, displayCount, filteredCourses.length, displayedCourses]);

  // Close faculty dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        setFacultyDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [facultySearch]);

  // Auto-scroll dropdown when navigating with keyboard
  useEffect(() => {
    if (facultyDropdownOpen && facultyListRef.current) {
      const highlightedElement = facultyListRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, facultyDropdownOpen]);

  // Format time
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format schedule with newlines
  const formatSchedule = (schedules) => {
    if (!schedules || schedules.length === 0) return 'TBA';
    return schedules.map(s =>
      `${s.day.slice(0, 3)} ${formatTime(s.startTime)}-${formatTime(s.endTime)}`
    ).join('\n');
  };

  // Add course to routine
  const addToRoutine = (course) => {
    const existsBySection = selectedCourses.find(c => c.sectionId === course.sectionId);
    const existsByCourse = selectedCourses.find(c => c.courseCode === course.courseCode);

    if (existsBySection) {
      // Removing course
      setCreditLimitWarning(false);
      setSelectedCourses(prev => prev.filter(c => c.sectionId !== course.sectionId));
    } else if (existsByCourse) {
      // Same course already exists (different section) - prevent adding and show warning
      toast.error(`${course.courseCode} is already in your routine (${existsByCourse.sectionName}). Remove it first to add a different section.`);
      return; // Don't proceed further
    } else {
      // Adding new course - check credit limit
      const newTotalCredits = selectedCourses.reduce((sum, c) => sum + (c.courseCredit || 0), 0) + (course.courseCredit || 0);

      if (newTotalCredits > 15) {
        setCreditLimitWarning(true);
        setTimeout(() => setCreditLimitWarning(false), 3000);
        return; // Don't proceed further
      }

      setSelectedCourses(prev => [...prev, course]);
    }
  };

  // Save routine to database
  const saveRoutine = async () => {
    if (!session?.user?.email) {
      toast.error('Please login to save your routine');
      return;
    }

    if (selectedCourses.length === 0) {
      toast.error('Please select some courses first');
      return;
    }

    setSavingRoutine(true);

    try {
      // Extract section IDs and sort them chronologically for consistent comparison
      const sectionIds = selectedCourses.map(course => course.sectionId).sort();
      const routineStr = btoa(JSON.stringify(sectionIds));

      // First, fetch existing routines to check for duplicates
      const checkResponse = await fetch('/api/routine', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.ok) {
        const existingData = await checkResponse.json();
        const existingRoutines = existingData.routines || [];

        // Check if the exact routine already exists
        const duplicateRoutine = existingRoutines.find(r => r.routineStr === routineStr);

        if (duplicateRoutine) {
          toast.error('This exact routine is already saved!');
          setSavingRoutine(false);
          return;
        }
      }

      // No duplicate found, proceed to save
      const response = await fetch('/api/routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routineStr,
          email: session.user.email
        }),
      });

      if (response.ok) {
        toast.success('Routine saved successfully!');
      } else {
        throw new Error('Failed to save routine');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Failed to save routine. Please try again.');
    } finally {
      setSavingRoutine(false);
    }
  };

  // Remove faculty from avoid list
  const removeFaculty = (faculty) => {
    setFilters(prev => ({
      ...prev,
      avoidFaculties: prev.avoidFaculties.filter(f => f !== faculty)
    }));
  };

  // Add faculty to avoid list
  const addFacultyToAvoid = (e) => {
    if (e.key === 'Enter' && facultySearch.trim()) {
      setFilters(prev => ({
        ...prev,
        avoidFaculties: [...prev.avoidFaculties, facultySearch.trim()]
      }));
      setFacultySearch('');
    }
  };

  return (
    <div className="min-h-screen text-gray-100 pb-24">
      {/* Toast Notification */}
      {customToast.show && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${customToast.type === 'success' ? 'bg-green-600 text-white' :
          customToast.type === 'info' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {customToast.type === 'success' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : customToast.type === 'info' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {customToast.message}
        </div>
      )}

      {/* Credit Limit Warning */}
      {creditLimitWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Cannot add more than 15 credits!
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-900 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 -mx-6 -mt-6 px-6 pt-6 pb-4">
        <div className="container mx-auto">
          {/* <h1 className="text-2xl font-bold text-white-500 mb-4 text-center">Build Routines with Confidence</h1> */}

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Course Code or Faculty Initial... e.g - CSE or FLA"
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            {/* Active Filters Dropdown - Shows when filters are applied */}
            {/* Saihan: Why are these comments so hard to read, ugh */}
            {(filters.hideFilled || filters.avoidFaculties.length > 0) && (
              <div className="relative" ref={filterDropdownRef}>
                {/* Dropdown Trigger Button */}
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="h-[50px] px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  title="Manage Active Filters"
                >
                  <div className="relative">
                    <Filter className="w-5 h-5" />
                    {/* Badge showing count of active filters */}
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {(filters.hideFilled ? 1 : 0) + filters.avoidFaculties.length}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                    {/* Dropdown Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Active Filters</h3>
                        {/* Clear All Button */}
                        <button
                          onClick={() => {
                            setFilters({ hideFilled: false, avoidFaculties: [] });
                            setFilterDropdownOpen(false);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to remove individual filters</p>
                    </div>

                    {/* Filter Items List */}
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {/* Hide Filled Sections Filter Item */}
                      {filters.hideFilled && (
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, hideFilled: false }))}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Hide Filled Sections</span>
                          </div>
                          <X className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                      )}

                      {/* Avoided Faculties Section */}
                      {filters.avoidFaculties.length > 0 && (
                        <div className="mt-1">
                          {/* Section Label */}
                          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Avoided Faculties
                          </div>
                          {/* Individual Faculty Items */}
                          {filters.avoidFaculties.map(faculty => (
                            <button
                              key={faculty}
                              onClick={() => removeFaculty(faculty)}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{faculty}</span>
                              </div>
                              <X className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Courses Tags */}
          {selectedCourses.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCourses.map(course => (
                <span
                  key={course.sectionId}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/50 rounded-full text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300"
                >
                  {course.courseCode}-[{course.sectionName}]-{course.faculties || 'TBA'}
                  <button
                    onClick={() => addToRoutine(course)}
                    className="hover:text-blue-500 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Table */}
      <div className="container mx-auto mt-6">
        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading courses...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Course Code</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Fac. Init.</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Prereq</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Seat Cap.</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Booked</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Available</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Class Schedule</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Lab Schedule</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Exam Day</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedCourses.map((course, index) => {
                  const isLast = index === displayedCourses.length - 1;
                  const isSelected = selectedCourses.find(c => c.sectionId === course.sectionId);
                  const availableSeats = course.capacity - course.consumedSeat;

                  return (
                    <tr
                      key={course.sectionId}
                      ref={isLast && displayCount < filteredCourses.length ? lastCourseRef : null}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                    >
                      <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {course.courseCode}-[{course.sectionName}]
                      </td>
                      <td className="py-3 px-2 text-sm relative text-gray-900 dark:text-gray-100">
                        <span
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onMouseEnter={(e) => {
                            if (course.faculties) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setFacultyImageError(false); // Reset image error state for new faculty
                              setHoveredFaculty({
                                initial: course.faculties,
                                ...getFacultyDetails(course.faculties)
                              });
                              setFacultyTooltipPosition({
                                x: rect.left,
                                y: rect.bottom + 8
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredFaculty(null)}
                        >
                          {course.faculties || 'TBA'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {(course.prerequisiteCourses || 'None').replace(/OR/g, '/').replace(/AND/g, '+').replace(/\//g, '/\n')}
                      </td>
                      <td className="py-3 px-2 text-sm text-center text-gray-900 dark:text-gray-100">{course.capacity}</td>
                      <td className="py-3 px-2 text-sm text-center text-gray-900 dark:text-gray-100">{course.consumedSeat}</td>
                      <td className="py-3 px-2 text-sm text-center">
                        <span className={`font-medium ${availableSeats > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {availableSeats}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs whitespace-pre-line text-gray-700 dark:text-gray-300">
                        {formatSchedule(course.sectionSchedule?.classSchedules)}
                      </td>
                      <td className="py-3 px-2 text-xs whitespace-pre-line text-gray-700 dark:text-gray-300">
                        {course.labSchedules?.length > 0 ? formatSchedule(course.labSchedules) : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                        {course.sectionSchedule?.finalExamDetail || 'TBA'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => addToRoutine(course)}
                          className={`p-2 rounded-lg transition-colors ${isSelected
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'border border-gray-400 dark:border-white text-gray-700 dark:text-white hover:bg-green-600 hover:border-green-600 hover:text-white'
                            }`}
                        >
                          {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {displayCount < filteredCourses.length && (
              <div className="text-center py-4">
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  Showing {displayCount} of {filteredCourses.length} courses
                </div>
                <button
                  onClick={() => setDisplayCount(prev => Math.min(prev + 50, filteredCourses.length))}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Load More ({Math.min(50, filteredCourses.length - displayCount)} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-blue-800/50 rounded-lg max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-blue-800/50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
                <p className="text-sm text-gray-500 dark:text-blue-300/70">Customize your course view</p>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-blue-300" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5">
              {/* Hide Filled Sections - Material Design Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-100 dark:bg-[#1e3a5f] rounded-lg hover:bg-gray-200 dark:hover:bg-[#234b7a] transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.hideFilled}
                    onChange={(e) => setFilters(prev => ({ ...prev, hideFilled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 rounded bg-transparent peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200 flex items-center justify-center">
                    {filters.hideFilled && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="absolute inset-0 -m-2 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-100 dark:peer-focus-visible:ring-offset-[#1e3a5f]"></div>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Hide Filled Sections</span>
                  <p className="text-xs text-gray-500 dark:text-blue-300/70">Only show sections with available seats</p>
                </div>
              </label>

              {/* Avoid Faculties - Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Avoid Faculties</label>

                {/* Selected Faculties Tags - above input */}
                {filters.avoidFaculties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {filters.avoidFaculties.map(faculty => (
                      <span
                        key={faculty}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 rounded-full text-sm flex items-center gap-2 text-red-700 dark:text-red-300"
                      >
                        {faculty}
                        <button
                          onClick={() => removeFaculty(faculty)}
                          className="hover:text-red-500 dark:hover:text-red-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative" ref={facultyDropdownRef}>
                  {/* Input with dropdown trigger */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 flex items-center">
                    <input
                      type="text"
                      placeholder="Search faculties..."
                      value={facultySearch}
                      onChange={(e) => {
                        setFacultySearch(e.target.value);
                        setFacultyDropdownOpen(true);
                      }}
                      onFocus={() => setFacultyDropdownOpen(true)}
                      onKeyDown={(e) => {
                        const filteredList = cdnFacultyList.filter(initial =>
                          initial.toLowerCase().includes(facultySearch.toLowerCase())
                        );

                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedIndex(prev => Math.min(prev + 1, filteredList.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedIndex(prev => Math.max(prev - 1, 0));
                        } else if (e.key === 'Enter' && filteredList.length > 0) {
                          e.preventDefault();
                          const selected = filteredList[highlightedIndex];
                          if (selected) {
                            const isSelected = filters.avoidFaculties.includes(selected);
                            if (isSelected) {
                              removeFaculty(selected);
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                avoidFaculties: [...prev.avoidFaculties, selected]
                              }));
                            }
                            setFacultySearch('');
                          }
                        } else if (e.key === 'Escape') {
                          setFacultyDropdownOpen(false);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFacultyDropdownOpen(!facultyDropdownOpen)}
                      className="px-3 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-r-lg"
                    >
                      <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${facultyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown - positioned to overflow modal */}
                  {facultyDropdownOpen && (
                    <div
                      className="absolute z-[9999] mt-1 w-full rounded-lg border border-gray-200 dark:border-blue-700/50 bg-white dark:bg-[#0f172a] shadow-xl"
                      style={{ maxHeight: '320px' }}
                    >
                      <div
                        ref={facultyListRef}
                        className="overflow-y-auto max-h-[320px] faculty-dropdown-scroll"
                      >
                        {cdnFacultyList
                          .filter(initial =>
                            initial.toLowerCase().includes(facultySearch.toLowerCase())
                          )
                          .slice(0, 100)
                          .map((initial, index) => {
                            const isSelected = filters.avoidFaculties.includes(initial);
                            const isHighlighted = index === highlightedIndex;
                            return (
                              <div
                                key={initial}
                                data-index={index}
                                className={`flex items-center px-3 py-2.5 cursor-pointer transition-colors ${isHighlighted ? 'bg-blue-600 text-white' : isSelected ? 'bg-blue-100 dark:bg-blue-800/40' : 'hover:bg-gray-100 dark:hover:bg-[#1e3a5f]'
                                  }`}
                                onClick={() => {
                                  if (isSelected) {
                                    removeFaculty(initial);
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      avoidFaculties: [...prev.avoidFaculties, initial]
                                    }));
                                  }
                                  setFacultySearch('');
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-sm ${isHighlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{initial}</div>
                                </div>
                                {isSelected && (
                                  <div className={`ml-2 ${isHighlighted ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {cdnFacultyList.length === 0 && (
                          <div className="py-4 text-center text-sm text-gray-500 dark:text-blue-300/70">Loading faculties...</div>
                        )}
                        {cdnFacultyList.length > 0 &&
                          cdnFacultyList.filter(initial =>
                            initial.toLowerCase().includes(facultySearch.toLowerCase())
                          ).length === 0 && (
                            <div className="py-4 text-center text-sm text-gray-500 dark:text-blue-300/70">No faculty found</div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-blue-800/50 bg-gray-50 dark:bg-[#0c1629]">
              <button
                onClick={() => {
                  setFilters({ hideFilled: false, avoidFaculties: [] });
                  setShowFilterModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium text-white"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Routine</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Credits: <span className={`font-bold ${totalCredits > 15 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {totalCredits}/15
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveRoutine}
                  disabled={savingRoutine || !session}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingRoutine ? 'Saving...' : 'Save Routine'}
                </button>
                <ExportRoutinePNG selectedCourses={enrichedSelectedCourses} routineRef={routineRef} />
                <button
                  onClick={() => setShowRoutineModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto" ref={routineRef}>
              <RoutineTableGrid
                selectedCourses={enrichedSelectedCourses}
                onRemoveCourse={addToRoutine}
                showRemoveButtons={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Faculty Hover Tooltip */}
      {hoveredFaculty && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-xl w-80 pointer-events-none"
          style={{
            left: `${Math.min(facultyTooltipPosition.x, window.innerWidth - 340)}px`,
            top: `${facultyTooltipPosition.y}px`
          }}
        >
          <div className="flex gap-4">
            {/* Faculty Image */}
            <div className="shrink-0">
              {hoveredFaculty.imgUrl && hoveredFaculty.imgUrl !== 'N/A' && !facultyImageError ? (
                <img
                  src={hoveredFaculty.imgUrl}
                  alt={hoveredFaculty.facultyName || 'Faculty'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                  onError={() => setFacultyImageError(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center border-2 border-blue-600 dark:border-blue-500">
                  <svg className="w-10 h-10 text-white dark:text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Faculty Details */}
            <div className="flex-1 space-y-1 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Initial:</span>{' '}
                <span className="font-medium text-blue-600 dark:text-blue-400">{hoveredFaculty.initial || 'Not Found'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{hoveredFaculty.facultyName || 'Not Found'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>{' '}
                <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{hoveredFaculty.facultyEmail || 'Not Found'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Routine Button */}
      <button
        onClick={() => setShowRoutineModal(true)}
        className="fixed bottom-6 right-6 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all hover:scale-105 z-40 flex items-center gap-3"
      >
        <div className="relative">
          <Calendar className="w-5 h-5" />
          {selectedCourses.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {selectedCourses.length}
            </span>
          )}
        </div>
        <span className="text-sm font-medium">Click to View Your Routine</span>
      </button>
    </div>
  );
};

export default PreRegistrationPage;