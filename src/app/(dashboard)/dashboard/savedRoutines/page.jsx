'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Trash2, Eye, Download, RefreshCw, AlertCircle, X, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { toast } from 'sonner';
import * as htmlToImage from 'html-to-image';

const SavedRoutinesPage = () => {
  const { data: session } = useSession();
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

  // Use sonner toast for notifications

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
      
      setRoutineCourses(matchedCourses);
      
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
      
      setMergedRoutineFriends(friends);
      
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
          return {
            ...course,
            friendName: friend?.friendName || 'Unknown',
            friendColor: friend?.color || '#6B7280'
          };
        });
      
      setMergedRoutineCourses(matchedCourses);
      
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

  // Simple Modal wrapper for routine display
  const RoutineTableModal = ({ selectedCourses, onClose }) => {
    const routineRef = useRef(null);

    const exportToPNG = async () => {
      if (!selectedCourses || selectedCourses.length === 0) {
        toast.error('No courses to export');
        return;
      }

      if (!routineRef?.current) {
        toast.error('Routine table not found');
        return;
      }

      try {
        const originalRoutineSegment = routineRef.current;
        if (!originalRoutineSegment) return;

        const scrolledWidth = 1800; // ! FORCE a standard desktop width- Change to increase downloaded image's width

        // ? Hidden container for the cloned routine segment
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = scrolledWidth + 'px'; 

        container.style.zoom=0.5;

        document.body.appendChild(container);

        // ? Cloning the Routine Segment
        const clonedRoutine = originalRoutineSegment.cloneNode(true);
        
        // ? Force the clonedRoutine to show everything and adjust to desktop resolution
        clonedRoutine.style.width = scrolledWidth + 'px';
        clonedRoutine.style.height = 'auto';
        clonedRoutine.style.overflow = 'visible';
        
        container.appendChild(clonedRoutine);

        // ? We are waiting here, because our browser can be stuipidly dumb (And also slow ¯\_(ツ)_/¯)
        // ? which causes html-to-image to capture the image before styles are even applied, resulting in a broken image
        await new Promise(resolve => setTimeout(resolve, 100));

        const dataUrl = await htmlToImage.toPng(clonedRoutine, {
          quality: 0.95,
          pixelRatio: 3, // ! Higher number -> Higher resolution -> Larger file size (Maybe add a slider on client side for them to adjust this in the future?) 
          backgroundColor: '#111827',
          width: scrolledWidth,
          height: clonedRoutine.scrollHeight, 
        });

        // ? Anhilation of the cloned routine and resetting styles back to normal
        document.body.removeChild(container);

        const link = document.createElement('a');
        link.download = `merged-routine-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
        
        toast.success('Routine exported successfully!');
      } catch (error) {
        console.error('Error exporting routine:', error);
        toast.error('Failed to export routine.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Saved Routine</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPNG}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save as PNG
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" ref={routineRef}>
            <RoutineTableGrid 
              selectedCourses={selectedCourses} 
              showRemoveButtons={false}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  };

  // Merged Routine Table Modal with color-coded cells
  const MergedRoutineTableModal = ({ courses, friends, onClose }) => {
    const routineRef = useRef(null);
    const [hoveredCourse, setHoveredCourse] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const timeSlots = [
      '08:00 AM-09:20 AM',
      '09:30 AM-10:50 AM',
      '11:00 AM-12:20 PM',
      '12:30 PM-01:50 PM',
      '02:00 PM-03:20 PM',
      '03:30 PM-04:50 PM',
      '05:00 PM-06:20 PM'
    ];
    
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

      if (!routineRef?.current) {
        toast.error('Routine table not found');
        return;
      }

      try {
        const originalRoutineSegment = routineRef.current;
        if (!originalRoutineSegment) return;
  
        const scrolledWidth = 1800; // ! FORCE a standard desktop width- Change to increase downloaded image's width
  
        // ? Hidden container for the cloned routine segment
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = scrolledWidth + 'px'; 
  
        container.style.zoom=0.5;
  
        document.body.appendChild(container);
  
        // ? Cloning the Routine Segment
        const clonedRoutine = originalRoutineSegment.cloneNode(true);
        
        // ? Force the clonedRoutine to show everything and adjust to desktop resolution
        clonedRoutine.style.width = scrolledWidth + 'px';
        clonedRoutine.style.height = 'auto';
        clonedRoutine.style.overflow = 'visible';
        
        container.appendChild(clonedRoutine);
  
        // ? We are waiting here, because our browser can be stuipidly dumb (And also slow ¯\_(ツ)_/¯)
        // ? which causes html-to-image to capture the image before styles are even applied, resulting in a broken image
        await new Promise(resolve => setTimeout(resolve, 100));
  
        const dataUrl = await htmlToImage.toPng(clonedRoutine, {
          quality: 0.95,
          pixelRatio: 3, // ! Higher number -> Higher resolution -> Larger file size (Maybe add a slider on client side for them to adjust this in the future?) 
          backgroundColor: '#111827',
          width: scrolledWidth,
          height: clonedRoutine.scrollHeight, 
        });
  
        // ? Anhilation of the cloned routine and resetting styles back to normal
        document.body.removeChild(container);
  
        const link = document.createElement('a');
        link.download = `merged-routine-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
        
        toast.success('Routine exported successfully!');
      } catch (error) {
        console.error('Error exporting routine:', error);
        toast.error('Failed to export routine.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Merged Routine</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPNG}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save as PNG
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" ref={routineRef}>
            <div className="bg-gray-900 p-4 rounded-lg">
              {/* Friend Legend */}
              <div className="mb-4 flex flex-wrap gap-3">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: friend.color }}
                    />
                    <span className="text-sm text-gray-400">{friend.friendName}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-400 w-36">Time/Day</th>
                      {days.map(day => (
                        <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-400">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot} className="border-b border-gray-800">
                        <td className="py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                          {timeSlot}
                        </td>
                        {days.map(day => {
                          const slotCourses = getCoursesForSlot(day, timeSlot);
                          
                          return (
                            <td key={`${day}-${timeSlot}`} className="p-2 border-l border-gray-800 relative">
                              {slotCourses.length > 0 && (
                                <div className="space-y-1">
                                  {slotCourses.map((course, idx) => {
                                    // Check if this specific time slot is for a lab
                                    const isLab = course.labSchedules?.some(s => {
                                      if (s.day !== day.toUpperCase()) return false;
                                      const scheduleStart = timeToMinutes(formatTime(s.startTime));
                                      const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                                      const slotStartMin = timeToMinutes(timeSlot.split('-')[0]);
                                      const slotEndMin = timeToMinutes(timeSlot.split('-')[1]);
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
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setTooltipPosition({ 
                                            x: rect.right + 10, 
                                            y: rect.top
                                          });
                                        }}
                                        onMouseLeave={() => setHoveredCourse(null)}
                                      >
                                        <div className="font-semibold">
                                          {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                        </div>
                                        <div className="text-gray-400 text-xs mt-0.5">
                                          {course.friendName}
                                        </div>
                                        {course.roomName && (
                                          <div className="text-gray-500 text-xs">
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tooltip */}
              {hoveredCourse && (
                <div 
                  className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl w-96 pointer-events-none"
                  style={{ 
                    left: `${tooltipPosition.x}px`, 
                    top: `${tooltipPosition.y}px`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <div className="space-y-2 text-sm">
                    <div className="font-bold text-lg">{hoveredCourse.courseCode}-{hoveredCourse.sectionName}</div>
                    <div><span className="text-gray-400">Friend:</span> {hoveredCourse.friendName}</div>
                    <div><span className="text-gray-400">Credits:</span> {hoveredCourse.courseCredit || 0}</div>
                    
                    {/* Faculty Information */}
                    <div className="bg-gray-700/50 rounded p-2 space-y-1">
                      <div className="font-medium text-blue-400">Faculty Information</div>
                      <div><span className="text-gray-400">Name:</span> {hoveredCourse.employeeName || hoveredCourse.faculties || 'TBA'}</div>
                      {hoveredCourse.employeeEmail && (
                        <div><span className="text-gray-400">Email:</span> {hoveredCourse.employeeEmail}</div>
                      )}
                      {!hoveredCourse.employeeEmail && hoveredCourse.faculties && (
                        <div><span className="text-gray-400">Initial:</span> {hoveredCourse.faculties}</div>
                      )}
                    </div>
                    
                    <div><span className="text-gray-400">Type:</span> {hoveredCourse.sectionType}</div>
                    <div><span className="text-gray-400">Capacity:</span> {hoveredCourse.capacity} ({hoveredCourse.consumedSeat} filled)</div>
                    <div><span className="text-gray-400">Prerequisites:</span> {hoveredCourse.prerequisiteCourses || 'None'}</div>
                    <div><span className="text-gray-400">Room:</span> {hoveredCourse.roomName || 'TBA'}</div>
                    {hoveredCourse.labCourseCode && (
                      <div><span className="text-gray-400">Lab:</span> {hoveredCourse.labCourseCode} - {hoveredCourse.labRoomName}</div>
                    )}
                    <div><span className="text-gray-400">Mid Exam:</span> {hoveredCourse.sectionSchedule?.midExamDetail || 'TBA'}</div>
                    <div><span className="text-gray-400">Final Exam:</span> {hoveredCourse.sectionSchedule?.finalExamDetail || 'TBA'}</div>
                    <div><span className="text-gray-400">Class Period:</span> {hoveredCourse.sectionSchedule?.classStartDate} to {hoveredCourse.sectionSchedule?.classEndDate}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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

  useEffect(() => {
    fetchRoutines();
    fetchMergedRoutines();
  }, []);

  return (
    <div className="min-h-screen  text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Saved Routines</h1>
      {/* sonner toast handles notifications globally */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
          <p className="text-gray-400">Loading saved routines...</p>
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
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              {/* Routine Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    {/* User's First name with routine number */}
                    <h3 className="font-semibold text-lg">
                      {session?.user?.name 
                        ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Routine #${routine.routineNumber}`
                        : `Routine #${routine.routineNumber}`}
                    </h3>
                    {/* Routine ID as copyable code subtitle */}
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(routine.id.toString());
                          setCopiedRoutineId(routine.id);
                          setTimeout(() => setCopiedRoutineId(null), 3000);
                        } catch (err) {
                          toast.error('Failed to copy ID');
                        }
                      }}
                      className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${
                        copiedRoutineId === routine.id 
                          ? 'text-green-400' 
                          : 'text-gray-300 hover:text-blue-400'
                      }`}
                    >
                      <code className={`px-2 py-0.5 rounded font-mono ${
                        copiedRoutineId === routine.id 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-gray-800'
                      }`}>{routine.id}</code>
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
                        <span className="inline-block bg-blue-800/80 text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {routine.semester}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
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
                  onClick={() => deleteRoutine(routine.id)}
                  className="px-3 py-2 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
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
        <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Merged Routines
        </h2>
        
        {loadingMerged ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-4" />
            <p className="text-gray-400">Loading merged routines...</p>
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
                  className="bg-gray-900 border border-purple-800/50 rounded-lg p-6 hover:border-purple-600/50 transition-colors"
                >
                  {/* Routine Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        {/* Merged Routine title with number */}
                        <h3 className="font-semibold text-lg text-purple-100">
                          {session?.user?.name 
                            ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Merged Routine #${routine.routineNumber}`
                            : `Merged Routine #${routine.routineNumber}`}
                        </h3>
                        {/* Routine ID as copyable code subtitle */}
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(routine.id.toString());
                              setCopiedMergedRoutineId(routine.id);
                              setTimeout(() => setCopiedMergedRoutineId(null), 3000);
                            } catch (err) {
                              toast.error('Failed to copy ID');
                            }
                          }}
                          className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${
                            copiedMergedRoutineId === routine.id 
                              ? 'text-green-400' 
                              : 'text-gray-300 hover:text-purple-400'
                          }`}
                        >
                          <code className={`px-2 py-0.5 rounded font-mono ${
                            copiedMergedRoutineId === routine.id 
                              ? 'bg-green-900/50 text-green-400' 
                              : 'bg-gray-800'
                          }`}>{routine.id}</code>
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
                            <span className="inline-block bg-purple-800/80 text-purple-100 text-[10px] font-semibold px-2 py-0.5 rounded">
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
                                className="inline-block bg-purple-900/50 text-purple-200 text-xs px-2 py-0.5 rounded"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-400 mt-1">
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
                      onClick={() => deleteMergedRoutine(routine.id)}
                      className="px-3 py-2 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
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
      {viewingRoutine && (
        <RoutineTableModal 
          selectedCourses={routineCourses} 
          onClose={closeRoutineModal}
        />
      )}

      {/* Merged Routine View Modal */}
      {viewingMergedRoutine && (
        <MergedRoutineTableModal 
          courses={mergedRoutineCourses}
          friends={mergedRoutineFriends}
          onClose={closeMergedRoutineModal}
        />
      )}
    </div>
  );
};
export default SavedRoutinesPage;
