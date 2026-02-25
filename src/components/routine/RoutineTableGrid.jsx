'use client';
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileRoutineView from '@/components/routine/MobileRoutineView';

const RoutineTableGrid = ({
  selectedCourses = [],
  onRemoveCourse = null,
  displayToast = null,
  showRemoveButtons = true,
  className = "",
  forceDesktop = false,
  mobileAction,
}) => {
  const routineRef = useRef(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [hoveredCourseTitle, setHoveredCourseTitle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, showLeft: false });
  const isMobile = useIsMobile();

  // Clear hovered course if it gets removed from selectedCourses
  React.useEffect(() => {
    if (hoveredCourse && !selectedCourses.find(c => c.sectionId === hoveredCourse.sectionId)) {
      setHoveredCourse(null);
      setHoveredCourseTitle(null);
    }
  }, [selectedCourses, hoveredCourse]);

  const timeSlots = getRoutineTimings();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Parse time to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  // Format time from 24h to 12h
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get courses for a specific time slot and day
  const getCoursesForSlot = (day, timeSlot) => {
    const [slotStart, slotEnd] = timeSlot.split('-');
    const slotStartMin = timeToMinutes(slotStart);
    const slotEndMin = timeToMinutes(slotEnd);

    return selectedCourses.filter(course => {
      // Check class schedules
      const classMatch = course.sectionSchedule?.classSchedules?.some(schedule => {
        if (schedule.day !== day.toUpperCase()) return false;
        const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
        const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
        // Check if the course time overlaps with the slot time
        return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
      });

      // Check lab schedules
      const labMatch = course.labSchedules?.some(schedule => {
        if (schedule.day !== day.toUpperCase()) return false;
        const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
        const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
        // Check if the course time overlaps with the slot time
        return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
      });

      return classMatch || labMatch;
    });
  };

  // Check for time conflicts
  const hasConflict = (day, timeSlot) => {
    const courses = getCoursesForSlot(day, timeSlot);
    return courses.length > 1;
  };


  // Prevents flashing desktop view on mobile while measuring
  if (isMobile === undefined) {
    return null;
  }

  // Mobile: render day-view card layout
  if (isMobile && !forceDesktop) {
    return (
      <div className={`w-full ${className}`}>
        <MobileRoutineView
          selectedCourses={selectedCourses}
          onRemoveCourse={onRemoveCourse}
          showRemoveButtons={showRemoveButtons}
          mobileAction={mobileAction}
        />
        {selectedCourses.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-900 rounded-lg">
            No courses selected. Add courses from the list to see them in your routine.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div ref={routineRef} className="bg-gray-50 dark:bg-gray-900 p-4">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th className="text-left py-4 px-4 text-base font-medium text-gray-600 dark:text-gray-400 w-44 border-r border-gray-300 dark:border-gray-700">Time/Day</th>
              {days.map(day => (
                <th key={day} className="text-center py-4 px-3 text-base font-medium text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, index) => {
              const matchSlot = REGULAR_TIMINGS[index];
              return (
                <tr key={timeSlot} className="border-b border-gray-300 dark:border-gray-700">
                  <td className="py-4 px-4 text-base font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-300 dark:border-gray-700">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const courses = getCoursesForSlot(day, matchSlot);
                    const conflict = hasConflict(day, matchSlot);

                    return (
                      <td key={`${day}-${timeSlot}`} className="p-2 border-r border-gray-300 dark:border-gray-700 last:border-r-0 relative">
                        {courses.length > 0 && (
                          <div className={`min-h-[80px] ${conflict ? 'space-y-1' : ''}`}>
                            {courses.map(course => {
                              const isLab = course.labSchedules?.some(s => {
                                if (s.day !== day.toUpperCase()) return false;
                                const scheduleStart = timeToMinutes(formatTime(s.startTime));
                                const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                                const slotStartMin = timeToMinutes(matchSlot.split('-')[0]);
                                const slotEndMin = timeToMinutes(matchSlot.split('-')[1]);
                                // Check if the lab time overlaps with the slot time
                                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
                              });

                              return (
                                <div
                                  key={course.sectionId}
                                  className={`p-2.5 rounded-r-lg rounded-l-[4px] transition-all duration-200 ${conflict
                                    ? 'bg-red-50/90 dark:bg-red-900/30 border-l-4 border-red-500 text-red-900 dark:text-red-100 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_12px_-2px_rgba(239,68,68,0.3)]'
                                    : isLab
                                      ? 'bg-purple-50/90 dark:bg-purple-900/30 border-l-4 border-purple-500 text-purple-900 dark:text-purple-100 shadow-[0_2px_10px_-3px_rgba(168,85,247,0.2)] hover:shadow-[0_4px_12px_-2px_rgba(168,85,247,0.3)]'
                                      : 'bg-blue-50/90 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-900 dark:text-blue-100 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_12px_-2px_rgba(59,130,246,0.3)]'
                                    } group relative flex flex-col justify-center min-h-[76px]`}
                                  onMouseEnter={(e) => {
                                    setHoveredCourse(course);
                                    setHoveredCourseTitle(`${course.courseCode}${isLab ? 'L' : ''}`);
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const viewportWidth = window.innerWidth;
                                    const tooltipWidth = 384; // w-96 = 384px

                                    // Position tooltip on left if it would go outside viewport
                                    const shouldShowLeft = rect.right + tooltipWidth + 10 > viewportWidth;

                                    setTooltipPosition({
                                      x: shouldShowLeft ? rect.left - tooltipWidth - 10 : rect.right + 10,
                                      y: rect.top,
                                      showLeft: shouldShowLeft
                                    });
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredCourse(null);
                                    setHoveredCourseTitle(null);
                                  }}
                                >
                                  <div className="font-bold text-sm tracking-tight leading-tight flex items-center gap-1.5">
                                    {course.courseCode}{isLab && 'L'}
                                    <span className="text-xs uppercase font-black px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/20 text-gray-900 dark:text-gray-100 shadow-sm">{course.sectionName}</span>
                                  </div>

                                  <div className="text-xs font-bold mt-1.5 flex flex-col gap-0.5">
                                    <div className="flex items-start gap-1">
                                      <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <div className="flex flex-col">
                                        {(isLab ? course.labRoomName || course.labRoomNumber || 'TBA' : course.roomName || course.roomNumber || 'TBA').split(';').map((part, i) => (
                                          <div key={i} className="leading-tight">{part.trim()}</div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {course.faculties && (
                                    <div className="text-[11px] opacity-70 mt-0.5 flex items-center gap-1 font-medium">
                                      <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="truncate">{course.faculties}</span>
                                    </div>
                                  )}

                                  {showRemoveButtons && onRemoveCourse && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveCourse(course);
                                      }}
                                      className="export-hide absolute top-1.5 right-1.5 p-1 bg-white/70 dark:bg-black/40 text-red-500 hover:bg-red-500 hover:text-white rounded-md opacity-60 group-hover:opacity-100 transition-all shadow-sm"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
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

        {/* Single global tooltip */}
        <CourseHoverTooltip course={hoveredCourse} position={tooltipPosition} courseTitle={hoveredCourseTitle} />

        {/* Color Legend - inside the export area so it's included in PNG */}
        {selectedCourses.length > 0 && (
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/50 border border-purple-400 dark:border-purple-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Lab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Conflict</span>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          Made with ❤️ from https://boracle.app
        </div>
      </div>

      {
        selectedCourses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No courses selected. Add courses from the list to see them in your routine.
          </div>
        )
      }
    </div >
  );
};

export default RoutineTableGrid;
