'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Trash2, Eye, Download, RefreshCw, AlertCircle, X, Users, Share2, Copy, Check, Link, Plus, Cable, Hammer, Pencil, Save } from 'lucide-react';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';
import ShareModal from '@/components/savedRoutine/ShareModal';
import RoutineView from '@/components/routine/RoutineView';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMergedRoutineView from '@/components/routine/MobileMergedRoutineView';
import { copyToClipboard } from '@/lib/utils';

/**
 * Wrapper that renders children in a mobile bottom-sheet or desktop centered modal.
 * Always rendered — uses isOpen to animate in/out.
 */
const MergedRoutineModalWrapper = ({ isMobile, isOpen, onClose, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const scrollYRef = React.useRef(0);

  const lockScroll = React.useCallback(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = '100%';
  }, []);

  const unlockScroll = React.useCallback(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollYRef.current);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (isMobile) {
        lockScroll();
        const timer = setTimeout(() => setIsVisible(true), 20);
        return () => clearTimeout(timer);
      }
    } else if (shouldRender) {
      // Animate out
      setIsVisible(false);
      if (isMobile) {
        const timer = setTimeout(() => {
          setShouldRender(false);
          unlockScroll();
          onClose?.();
        }, 250);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(false);
        onClose?.();
      }
    }
  }, [isOpen, isMobile, shouldRender, lockScroll, unlockScroll, onClose]);

  // Safety: always unlock on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, []);

  const handleClose = () => {
    if (isMobile) {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        unlockScroll();
        onClose?.();
      }, 250);
    } else {
      setShouldRender(false);
      onClose?.();
    }
  };

  if (!shouldRender) return null;

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleClose}
        />
        {/* Bottom sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transform transition-transform duration-250 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: '80vh' }}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="flex flex-col h-[calc(80vh-1rem)] overflow-hidden">
            {React.Children.map(children, child =>
              React.isValidElement(child)
                ? React.cloneElement(child, {
                  className: child.props.className?.replace(/max-w-\[95vw\]|max-h-\[95vh\]|shadow-xl|z-\[70\]/g, '').trim() + ' h-full',
                  onClose: handleClose,
                })
                : child
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      {children}
    </div>
  );
};

// Merged Routine Table Modal with color-coded cells
const MergedRoutineTableModal = ({ courses, friends, onClose, isOpen, isMobile }) => {
  const routineRef = useRef(null);
  const exportRef = useRef(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredCourseTitle, setHoveredCourseTitle] = useState(null);

  const timeSlots = getRoutineTimings();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Time conversion utilities
  const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get courses for a specific slot
  const getCoursesForSlot = (day, timeSlot) => {
    const [slotStart, slotEnd] = timeSlot.split('-');
    const slotStartMin = timeToMinutes(slotStart);
    const slotEndMin = timeToMinutes(slotEnd);

    return courses.filter(course => {
      // Check class schedules
      const classMatch = course.sectionSchedule?.classSchedules?.some(schedule => {
        if (schedule.day !== day.toUpperCase()) return false;
        const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
        const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
        return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
      });

      // Check lab schedules
      const labMatch = course.labSchedules?.some(schedule => {
        if (schedule.day !== day.toUpperCase()) return false;
        const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
        const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
        return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
      });

      return classMatch || labMatch;
    });
  };

  const exportToPNG = async () => {
    if (!courses || courses.length === 0) {
      toast.error('No courses to export');
      return;
    }

    // On mobile, use the hidden desktop table ref for export
    const ref = isMobile ? exportRef : routineRef;

    if (!ref?.current) {
      toast.error('Routine table not found');
      return;
    }

    await exportRoutineToPNG({
      routineRef: ref,
      filename: 'merged-routine',
      showToast: true,
    });
  };

  const renderDesktopTable = () => (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      {/* Friend Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {friends.map(friend => (
          <div key={friend.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: friend.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{friend.friendName}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-36 border-r border-gray-200 dark:border-gray-700">Time/Day</th>
              {days.map(day => (
                <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, index) => {
              const matchSlot = REGULAR_TIMINGS[index];
              return (
                <tr key={timeSlot} className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const slotCourses = getCoursesForSlot(day, matchSlot);

                    return (
                      <td key={`${day}-${timeSlot}`} className="p-2 border-l border-gray-200 dark:border-gray-800 relative">
                        {slotCourses.length > 0 && (
                          <div className="space-y-1">
                            {slotCourses.map((course, idx) => {
                              // Check if this specific time slot is for a lab
                              const isLab = course.labSchedules?.some(s => {
                                if (s.day !== day.toUpperCase()) return false;
                                const scheduleStart = timeToMinutes(formatTime(s.startTime));
                                const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                                const slotStartMin = timeToMinutes(matchSlot.split('-')[0]);
                                const slotEndMin = timeToMinutes(matchSlot.split('-')[1]);
                                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
                              });

                              return (
                                <div
                                  key={`${course.sectionId}-${idx}`}
                                  className="p-2 rounded text-xs transition-opacity hover:opacity-90 cursor-pointer"
                                  style={{
                                    backgroundColor: `${course.friendColor}30`,
                                    borderLeft: `3px solid ${course.friendColor}`
                                  }}
                                  onMouseEnter={(e) => {
                                    setHoveredCourse(course);
                                    setHoveredCourseTitle(`${course.courseCode}${isLab ? 'L' : ''}`);
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const viewportWidth = window.innerWidth;
                                    const tooltipWidth = 384; // w-96 = 384px
                                    const shouldShowLeft = rect.right + tooltipWidth + 10 > viewportWidth;

                                    setTooltipPosition({
                                      x: shouldShowLeft ? rect.left - tooltipWidth - 10 : rect.right + 10,
                                      y: rect.top
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredCourse(null)}
                                >
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                    {course.friendName}
                                  </div>
                                  {course.roomName && (
                                    <div className="text-gray-500 dark:text-gray-500 text-xs">
                                      {course.roomName}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      <CourseHoverTooltip
        course={hoveredCourse}
        position={tooltipPosition}
        courseTitle={hoveredCourseTitle}
        extraFields={hoveredCourse ? [{ label: 'Friend', value: hoveredCourse.friendName }] : []}
      />
    </div>
  );

  return (
    <MergedRoutineModalWrapper isMobile={isMobile} isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col shadow-xl z-[70]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-xl'}`}>Merged Routine</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPNG}
              className={`bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white ${isMobile ? 'p-2' : 'px-4 py-2'}`}
              title="Save as PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {!isMobile && 'Save as PNG'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4" ref={routineRef}>
          {isMobile ? (
            <>
              <MobileMergedRoutineView
                courses={courses}
                friends={friends}
              />
              {/* Hidden desktop table for PNG export */}
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  width: '1800px',
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: -1,
                  overflow: 'visible',
                }}
                aria-hidden="true"
              >
                <div ref={exportRef}>
                  {renderDesktopTable()}
                </div>
              </div>
            </>
          ) : (
            renderDesktopTable()
          )}
        </div>
      </div>
    </MergedRoutineModalWrapper>
  );
};

const SavedRoutinesPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [routines, setRoutines] = useState([]);
  const [mergedRoutines, setMergedRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMerged, setLoadingMerged] = useState(true);
  const [error, setError] = useState(null);
  // Removed local toast state, use sonner toast only
  const [viewingRoutine, setViewingRoutine] = useState(null);
  const [viewingMergedRoutine, setViewingMergedRoutine] = useState(null);
  const [routineCourses, setRoutineCourses] = useState([]);
  const [mergedRoutineCourses, setMergedRoutineCourses] = useState([]);
  const [mergedRoutineFriends, setMergedRoutineFriends] = useState([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [copiedRoutineId, setCopiedRoutineId] = useState(null);
  const [copiedMergedRoutineId, setCopiedMergedRoutineId] = useState(null);

  // Floating button states
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [routineIdInput, setRoutineIdInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [sharingRoutineId, setSharingRoutineId] = useState(null);
  const [sharingRoutineType, setSharingRoutineType] = useState('routine');
  const [facultyMap, setFacultyMap] = useState({});

  // Editing state
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Predefined color palette for friends
  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#E879F9', // Fuchsia
    '#A855F7', // Violet
    '#F43F5E', // Rose
    '#8B5CF6', // Indigo
    '#0EA5E9', // Sky
  ];


  // Fetch faculty data for tooltip enrichment
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/faculty/lookup')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFacultyMap(data.facultyMap);

            // Re-enrich currently viewed routine courses if any
            setRoutineCourses(prev => prev.map(course => {
              const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
              const facultyInfo = data.facultyMap[firstInitial];
              return {
                ...course,
                employeeName: facultyInfo?.facultyName || null,
                employeeEmail: facultyInfo?.email || null,
                imgUrl: facultyInfo?.imgUrl || null,
              };
            }));

            // Re-enrich currently viewed merged routine courses if any
            setMergedRoutineCourses(prev => prev.map(course => {
              const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
              const facultyInfo = data.facultyMap[firstInitial];
              return {
                ...course,
                employeeName: facultyInfo?.facultyName || null,
                employeeEmail: facultyInfo?.email || null,
                imgUrl: facultyInfo?.imgUrl || null,
              };
            }));
          }
        })
        .catch(err => console.error('Error fetching faculty data:', err));
    }
  }, [session]);

  // Close floating options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFloatingOptions
        && !event.target.closest('.floating-action-container')
        && !event.target.closest('.floating-action-sheet')) {
        setShowFloatingOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFloatingOptions]);

  // Fetch saved routines
  const fetchRoutines = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/routine', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routines');
      }

      const data = await response.json();

      if (data.success) {
        // Sort routines by createdAt (newest first) for display, but keep original order info for numbering
        const routinesWithIndex = (data.routines || [])
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)) // oldest first for numbering
          .map((routine, idx) => ({ ...routine, routineNumber: idx + 1 })) // assign number based on creation order
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); // newest first for display
        setRoutines(routinesWithIndex);
        console.log('Fetched routines:', routinesWithIndex);
      } else {
        throw new Error('Failed to fetch routines');
      }

    } catch (err) {
      console.error('Error fetching routines:', err);
      setError('Failed to load saved routines');
      toast.error('Failed to load saved routines');
    } finally {
      setLoading(false);
    }
  };

  // Fetch merged routines
  const fetchMergedRoutines = async () => {
    try {
      setLoadingMerged(true);

      const response = await fetch('/api/merged-routine', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merged routines');
      }

      const data = await response.json();

      if (data.success) {
        // Sort merged routines by createdAt (newest first) for display, but keep original order info for numbering
        const routinesWithIndex = (data.routines || [])
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)) // oldest first for numbering
          .map((routine, idx) => ({ ...routine, routineNumber: idx + 1 })) // assign number based on creation order
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); // newest first for display
        setMergedRoutines(routinesWithIndex);
        console.log('Fetched merged routines:', routinesWithIndex);
      } else {
        throw new Error('Failed to fetch merged routines');
      }
    } catch (err) {
      console.error('Error fetching merged routines:', err);
    } finally {
      setLoadingMerged(false);
    }
  };

  // Delete routine
  const deleteRoutine = async (routineId) => {
    try {
      const response = await fetch(`/api/routine/${routineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRoutines(prev => prev.filter(routine => routine.id !== routineId));
        toast.success('Routine deleted successfully');
      } else {
        throw new Error('Failed to delete routine');
      }
    } catch (err) {
      console.error('Error deleting routine:', err);
      toast.error('Failed to delete routine');
    }
  };

  // Delete merged routine
  const deleteMergedRoutine = async (routineId) => {
    try {
      const response = await fetch(`/api/merged-routine/${routineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMergedRoutines(prev => prev.filter(routine => routine.id !== routineId));
        toast.success('Merged routine deleted successfully');
      } else {
        throw new Error('Failed to delete merged routine');
      }
    } catch (err) {
      console.error('Error deleting merged routine:', err);
      toast.error('Failed to delete merged routine');
    }
  };

  // Parse routine string to get course info
  const parseRoutineString = (routineStr) => {
    try {
      const sectionIds = JSON.parse(atob(routineStr));
      return sectionIds.length;
    } catch (err) {
      return 0;
    }
  };

  // Parse merged routine data to get friend names and total courses
  const parseMergedRoutineData = (routineData) => {
    try {
      const data = JSON.parse(routineData);
      const friendNames = data.map(item => item.friendName).filter(Boolean);
      const totalCourses = data.reduce((sum, item) => sum + (item.sectionIds?.length || 0), 0);
      return { friendNames, totalCourses };
    } catch (err) {
      return { friendNames: [], totalCourses: 0 };
    }
  };

  // ! Import routine by ID [Saved + Merged]
  const importRoutineById = async () => {
    if (!routineIdInput.trim()) {
      toast.error('Please enter a routine ID');
      return;
    }

    try {
      setImporting(true);
      const routineId = routineIdInput.trim();

      // ! Hunt routine in saved routines first
      const savedResponse = await fetch(`/api/routine/${routineId}`);
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        if (savedData.success && savedData.routine) {
          // ? Import as a new saved routine - POST request to routine endpoint
          const importResponse = await fetch('/api/routine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              routineStr: savedData.routine.routineStr,
              email: session.user.email
            })
          });

          if (importResponse.ok) {
            toast.success('Routine imported successfully!');
            fetchRoutines(); // Refreshing the list, to show the newly imported routine :D :D :D
            setShowImportModal(false);
            setRoutineIdInput('');
            return;
          }
        }
      }

      // ! Next, Checking in the merged routines table if not found in saved routines
      const mergedResponse = await fetch(`/api/merged-routine/${routineId}`);
      if (mergedResponse.ok) {
        const mergedData = await mergedResponse.json();
        if (mergedData.success && mergedData.routine) {
          // ? Import as a new merged routine - POST request to merged routine endpoint
          const importResponse = await fetch('/api/merged-routine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              routineData: mergedData.routine.routineData
            })
          });

          if (importResponse.ok) {
            toast.success('Merged routine imported successfully!');
            fetchMergedRoutines(); // Refresh the list
            setShowImportModal(false);
            setRoutineIdInput('');
            return;
          }
        }
      }

      // If routine not found in either table
      toast.error('Routine not found. Please check the routine ID.');

    } catch (error) {
      console.error('Error importing routine:', error);
      toast.error('Failed to import routine');
    } finally {
      setImporting(false);
    }

  };

  // Update routine name
  const updateRoutineName = async (routineId) => {
    try {
      setIsSavingName(true);

      const response = await fetch(`/api/routine/${routineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routineName: editNameInput }),
      });

      if (response.ok) {
        setRoutines(prev => prev.map(r =>
          r.id === routineId ? { ...r, routineName: editNameInput } : r
        ));
        setEditingRoutineId(null);
        toast.success('Routine name updated!');
      } else {
        throw new Error('Failed to update routine name');
      }
    } catch (err) {
      console.error('Error updating routine name:', err);
      toast.error('Failed to update routine name');
    } finally {
      setIsSavingName(false);
    }
  };

  // ? Handle floating button actions
  const handleBuildRoutine = () => {
    router.push('/dashboard/preprereg');
    setShowFloatingOptions(false);
  };

  const handleMergeRoutines = () => {
    router.push('/dashboard/merge-routines');
    setShowFloatingOptions(false);
  };

  const handleImportRoutine = () => {
    setShowImportModal(true);
    setShowFloatingOptions(false);
  };

  // View routine details - fetch course data and show in modal
  const viewRoutine = async (routine) => {
    try {
      setLoadingRoutine(true);
      setViewingRoutine(routine);

      // Decode the routine string to get section IDs
      const sectionIds = JSON.parse(atob(routine.routineStr));

      // Fetch course data from the API
      const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
      const allCourses = await response.json();

      // Filter courses that match the section IDs in the routine
      const matchedCourses = allCourses.filter(course =>
        sectionIds.includes(course.sectionId)
      );

      setRoutineCourses(matchedCourses.map(course => {
        const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
        const facultyInfo = facultyMap[firstInitial];
        return {
          ...course,
          employeeName: facultyInfo?.facultyName || null,
          employeeEmail: facultyInfo?.email || null,
          imgUrl: facultyInfo?.imgUrl || null,
        };
      }));

      if (matchedCourses.length === 0) {
        toast.error('No matching courses found for this routine');
      }
    } catch (err) {
      console.error('Error viewing routine:', err);
      toast.error('Failed to load routine details');
      setViewingRoutine(null);
    } finally {
      setLoadingRoutine(false);
    }
  };

  // View merged routine details - fetch course data and show in modal
  const viewMergedRoutine = async (routine) => {
    try {
      setLoadingRoutine(true);
      setViewingMergedRoutine(routine);

      // Parse the routine data to get all section IDs with friend info
      const data = JSON.parse(routine.routineData);

      // Create friends array with colors
      const friends = data.map((item, index) => ({
        id: index,
        friendName: item.friendName,
        color: colorPalette[index % colorPalette.length],
        sectionIds: item.sectionIds || []
      }));

      const allSectionIds = data.flatMap(item => item.sectionIds || []);

      // Fetch course data from the API
      const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
      const allCourses = await response.json();

      // Filter courses that match the section IDs and attach friend info
      const matchedCourses = allCourses
        .filter(course => allSectionIds.includes(course.sectionId))
        .map(course => {
          // Find which friend this course belongs to
          const friend = friends.find(f => f.sectionIds.includes(course.sectionId));
          // Enrich with faculty data if available
          const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
          const facultyInfo = facultyMap[firstInitial];
          return {
            ...course,
            friendName: friend?.friendName || 'Unknown',
            friendColor: friend?.color || '#6B7280',
            employeeName: facultyInfo?.facultyName || null,
            employeeEmail: facultyInfo?.email || null,
            imgUrl: facultyInfo?.imgUrl || null,
          };
        });

      setMergedRoutineCourses(matchedCourses);
      setMergedRoutineFriends(friends);

      if (matchedCourses.length === 0) {
        toast.error('No matching courses found for this merged routine');
      }
    } catch (err) {
      console.error('Error viewing merged routine:', err);
      toast.error('Failed to load merged routine details');
      setViewingMergedRoutine(null);
    } finally {
      setLoadingRoutine(false);
    }
  };






  // Helper to close modal
  const closeRoutineModal = () => {
    setViewingRoutine(null);
    setRoutineCourses([]);
  };

  // Helper to close merged routine modal
  const closeMergedRoutineModal = () => {
    setViewingMergedRoutine(null);
    setMergedRoutineCourses([]);
    setMergedRoutineFriends([]);
  };

  const isMobileDevice = useIsMobile();

  useEffect(() => {
    fetchRoutines();
    fetchMergedRoutines();
  }, []);

  // Back button/gesture handler
  useEffect(() => {
    const handlePopState = (event) => {
      // If we are coming back TO this modal level after closing a child, don't close this one!
      if (event.state?.id === 'savedRoutineModal') return;

      if (viewingMergedRoutine) {
        closeMergedRoutineModal();
      } else if (viewingRoutine) {
        closeRoutineModal();
      }
    };

    if (viewingRoutine || viewingMergedRoutine) {
      window.history.pushState({ id: 'savedRoutineModal' }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingRoutine, viewingMergedRoutine]);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Saved Routines</h1>
      {/* sonner toast handles notifications globally */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading saved routines...</p>
        </div>
      ) : routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <AlertCircle className="w-8 h-8 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            You haven't saved any routines yet. Create a routine in the Pre-Registration page to get started.
          </p>
          <a
            href="/dashboard/preprereg"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Build New Routine
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine, index) => (
            <div
              key={routine.id}
              className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-600/50 transition-colors shadow-sm"
            >
              {/* Routine Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    {/* User's First name with routine number */}
                    <div className="flex items-center gap-2">
                      {editingRoutineId === routine.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Input
                              value={editNameInput}
                              onChange={(e) => setEditNameInput(e.target.value)}
                              className={`h-8 w-48 text-sm bg-gray-50 dark:bg-gray-800 ${editNameInput.length === 40 ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-blue-500'} focus:ring-blue-500 text-gray-900 dark:text-white`}
                              placeholder="Enter routine name"
                              maxLength={40}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateRoutineName(routine.id);
                                if (e.key === 'Escape') setEditingRoutineId(null);
                              }}
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateRoutineName(routine.id)}
                                disabled={isSavingName}
                                className="p-1.5 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                              >
                                {isSavingName ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingRoutineId(null)}
                                disabled={isSavingName}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <span className={`text-[10px] ml-1 ${editNameInput.length === 40 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {editNameInput.length === 40 ? '40 characters max (limit reached)' : '40 characters max'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/name">
                          <h3 className="font-semibold text-lg">
                            {routine.routineName || (session?.user?.name
                              ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Routine #${routine.routineNumber}`
                              : `Routine #${routine.routineNumber}`)}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingRoutineId(routine.id);
                              setEditNameInput(routine.routineName || (session?.user?.name
                                ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Routine #${routine.routineNumber}`
                                : `Routine #${routine.routineNumber}`));
                            }}
                            className="p-1 opacity-0 group-hover/name:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Routine ID as copyable code subtitle */}
                    <button
                      onClick={async () => {
                        const success = await copyToClipboard(routine.id.toString());
                        if (success) {
                          setCopiedRoutineId(routine.id);
                          setTimeout(() => setCopiedRoutineId(null), 3000);
                        } else {
                          toast.error('Failed to copy ID');
                        }
                      }}
                      className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copiedRoutineId === routine.id
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                      <code className={`px-2 py-0.5 rounded font-mono text-left ${copiedRoutineId === routine.id
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>{routine.id.substring(0, 4)}...{routine.id.substring(32, 36)}</code>
                      <span className="flex items-center gap-1">
                        {copiedRoutineId === routine.id ? 'Copied' : 'Copy'}
                        {copiedRoutineId === routine.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <rect x="3" y="3" width="13" height="13" rx="2" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-500">
                        {routine.createdAt ? new Date(Number(routine.createdAt) * 1000).toLocaleString() : 'N/A'}
                      </p>
                      {routine.semester && (
                        <span className="inline-block bg-blue-100 dark:bg-blue-800/80 text-blue-700 dark:text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {routine.semester}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {parseRoutineString(routine.routineStr)} courses
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => viewRoutine(routine)}
                  disabled={loadingRoutine}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {loadingRoutine && viewingRoutine?.id === routine.id ? 'Loading...' : 'View'}
                </button>
                <button
                  onClick={() => { setSharingRoutineId(routine.id); setSharingRoutineType('routine'); }}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors text-gray-600 dark:text-gray-300"
                  title="Share routine"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="px-3 py-2 hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged Routines Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2 text-gray-900 dark:text-white">
          <Users className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          Merged Routines
        </h2>

        {loadingMerged ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading merged routines...</p>
          </div>
        ) : mergedRoutines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Users className="w-8 h-8 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              You haven't saved any merged routines yet. Create a merged routine in the Merge Routines page.
            </p>
            <a
              href="/dashboard/merge-routines"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Merge Routines
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mergedRoutines.map((routine, index) => {
              const { friendNames, totalCourses } = parseMergedRoutineData(routine.routineData);
              return (
                <div
                  key={routine.id}
                  className="bg-white dark:bg-gray-800/50 border border-purple-200 dark:border-purple-700/50 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-600/50 transition-colors shadow-sm"
                >
                  {/* Routine Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        {/* Merged Routine title with number */}
                        <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-100">
                          {session?.user?.name
                            ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Merged Routine #${routine.routineNumber}`
                            : `Merged Routine #${routine.routineNumber}`}
                        </h3>
                        {/* Routine ID as copyable code subtitle */}
                        <button
                          onClick={async () => {
                            const success = await copyToClipboard(routine.id.toString());
                            if (success) {
                              setCopiedMergedRoutineId(routine.id);
                              setTimeout(() => setCopiedMergedRoutineId(null), 3000);
                            } else {
                              toast.error('Failed to copy ID');
                            }
                          }}
                          className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copiedMergedRoutineId === routine.id
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                        >
                          <code className={`px-2 py-0.5 rounded font-mono text-left ${copiedMergedRoutineId === routine.id
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>{routine.id.substring(0, 4)}...{routine.id.substring(32, 36)}</code>
                          <span className="flex items-center gap-1">
                            {copiedMergedRoutineId === routine.id ? 'Copied' : 'Copy'}
                            {copiedMergedRoutineId === routine.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <rect x="3" y="3" width="13" height="13" rx="2" />
                              </svg>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-gray-500">
                            {routine.createdAt ? new Date(Number(routine.createdAt) * 1000).toLocaleString() : 'N/A'}
                          </p>
                          {routine.semester && (
                            <span className="inline-block bg-purple-100 dark:bg-purple-800/80 text-purple-700 dark:text-purple-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {routine.semester}
                            </span>
                          )}
                        </div>
                        {/* Friend Names */}
                        {friendNames.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {friendNames.map((name, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 text-xs px-2 py-0.5 rounded"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {totalCourses} courses • {friendNames.length} {friendNames.length === 1 ? 'friend' : 'friends'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewMergedRoutine(routine)}
                      disabled={loadingRoutine}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {loadingRoutine && viewingMergedRoutine?.id === routine.id ? 'Loading...' : 'View'}
                    </button>
                    <button
                      onClick={() => { setSharingRoutineId(routine.id); setSharingRoutineType('merged-routine'); }}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors text-gray-600 dark:text-gray-300"
                      title="Share routine"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMergedRoutine(routine.id)}
                      className="px-3 py-2 hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routine View Modal */}
      <RoutineView
        title="Saved Routine"
        courses={routineCourses}
        isOpen={!!viewingRoutine}
        onClose={closeRoutineModal}
        isModal={true}
      />

      {/* Merged Routine View Modal — always rendered, uses isOpen */}
      <MergedRoutineTableModal
        courses={mergedRoutineCourses}
        friends={mergedRoutineFriends}
        isOpen={!!viewingMergedRoutine}
        onClose={closeMergedRoutineModal}
        isMobile={isMobileDevice}
      />

      {/* Backdrop overlay when floating menu is open */}
      {showFloatingOptions && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setShowFloatingOptions(false)}
        />
      )}

      {/* Centered Action Sheet */}
      {showFloatingOptions && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="floating-action-sheet pointer-events-auto flex flex-col gap-3 w-80 animate-in fade-in zoom-in-95 duration-200">
            {/* Build a Routine */}
            <button
              onClick={handleBuildRoutine}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-blue-500/50 hover:shadow-blue-500/10 hover:ring-2 hover:ring-blue-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-blue-500/15 group-hover:bg-blue-500/25 transition-colors">
                <Hammer className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Build a Routine</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Create your own from scratch</span>
              </div>
            </button>

            {/* Import a Routine */}
            <button
              onClick={handleImportRoutine}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-green-500/50 hover:shadow-green-500/10 hover:ring-2 hover:ring-green-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-green-500/15 group-hover:bg-green-500/25 transition-colors">
                <Download className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Import a Routine</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Via a shared Routine ID</span>
              </div>
            </button>

            {/* Merge Routines */}
            <button
              onClick={handleMergeRoutines}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-purple-500/50 hover:shadow-purple-500/10 hover:ring-2 hover:ring-purple-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-purple-500/15 group-hover:bg-purple-500/25 transition-colors">
                <Cable className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Merge Routines</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Combine with friends</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 floating-action-container">
        <button
          onClick={() => setShowFloatingOptions(!showFloatingOptions)}
          className="group px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-3 text-white"
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${showFloatingOptions ? 'rotate-45' : 'rotate-0'}`} />
          <span className="text-sm font-semibold">Add Routine</span>
        </button>
      </div>

      {/* Import Routine Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md !bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700/60 !rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <Download className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-center text-lg">
              Import a Routine
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
              Enter the routine ID shared by your friend. We&apos;ll automatically detect the type and save a copy to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2 pb-1">
            <div className="space-y-2">
              <Label htmlFor="routine-id" className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Routine ID</Label>
              <Input
                id="routine-id"
                placeholder="Paste your routine ID here..."
                value={routineIdInput}
                onChange={(e) => setRoutineIdInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && routineIdInput.trim() && !importing) importRoutineById(); }}
                disabled={importing}
                className="h-12 rounded-xl !bg-gray-50 dark:!bg-gray-900 !border-gray-300 dark:!border-gray-700 text-center text-lg font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:!border-blue-500 focus-visible:!ring-blue-500/20"
              />
            </div>

            <Button
              onClick={importRoutineById}
              disabled={importing || !routineIdInput.trim()}
              className="w-full h-11 rounded-xl !bg-blue-600 hover:!bg-blue-500 !text-white font-semibold transition-colors disabled:opacity-40 !shadow-none"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import Routine
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Share Modal */}
      {sharingRoutineId && (
        <ShareModal
          routineId={sharingRoutineId}
          type={sharingRoutineType}
          onClose={() => setSharingRoutineId(null)}
        />
      )}
    </div>
  );
};
export default SavedRoutinesPage;
