'use client';
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';

const RoutineTableGrid = ({
  selectedCourses = [],
  onRemoveCourse = null,
  displayToast = null,
  showRemoveButtons = true,
  className = ""
}) => {
  const routineRef = useRef(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [hoveredCourseTitle, setHoveredCourseTitle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, showLeft: false });

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
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot} className="border-b border-gray-300 dark:border-gray-700">
                <td className="py-4 px-4 text-base font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-300 dark:border-gray-700">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const courses = getCoursesForSlot(day, timeSlot);
                  const conflict = hasConflict(day, timeSlot);

                  return (
                    <td key={`${day}-${timeSlot}`} className="p-2 border-r border-gray-300 dark:border-gray-700 last:border-r-0 relative">
                      {courses.length > 0 && (
                        <div className={`min-h-[80px] ${conflict ? 'space-y-1' : ''}`}>
                          {courses.map(course => {
                            const isLab = course.labSchedules?.some(s => {
                              if (s.day !== day.toUpperCase()) return false;
                              const scheduleStart = timeToMinutes(formatTime(s.startTime));
                              const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                              const slotStartMin = timeToMinutes(timeSlot.split('-')[0]);
                              const slotEndMin = timeToMinutes(timeSlot.split('-')[1]);
                              // Check if the lab time overlaps with the slot time
                              return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
                            });

                            return (
                              <div
                                key={course.sectionId}
                                className={`p-3 rounded text-sm ${conflict
                                    ? 'bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-900 dark:text-red-100'
                                    : isLab
                                      ? 'bg-purple-100 dark:bg-purple-900/50 border border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-100'
                                      : 'bg-blue-100 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-100'
                                  } hover:opacity-80 transition-opacity ${onRemoveCourse ? 'cursor-pointer' : ''} group relative`}
                                onClick={() => onRemoveCourse?.(course)}
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
                                <div className="font-semibold text-base">
                                  {course.courseCode}{isLab && 'L'}-{course.sectionName}-{isLab ? course.labRoomName || course.labRoomNumber || 'TBA' : course.roomName || course.roomNumber || 'TBA'}
                                </div>
                                {course.faculties && (
                                  <div className="text-gray-600 dark:text-gray-400 truncate text-sm mt-1">
                                    {course.faculties}
                                  </div>
                                )}
                                {showRemoveButtons && onRemoveCourse && (
                                  <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3 text-red-500 dark:text-red-400" />
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
            ))}
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
          Made with ❤️ from https://oracle.eniamza.com
        </div>
      </div>

      {selectedCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No courses selected. Add courses from the list to see them in your routine.
        </div>
      )}
    </div>
  );
};

export default RoutineTableGrid;
