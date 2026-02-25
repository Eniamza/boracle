'use client';
import React, { useState } from 'react';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';

const MergedRoutineGrid = ({ courses, friends, forwardedRef }) => {
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

    return (
        <div ref={forwardedRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg min-w-max">
            {/* Friend Legend */}
            <div className="mb-4 flex flex-wrap gap-3" data-html2canvas-ignore>
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
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-36">Time/Day</th>
                            {days.map(day => (
                                <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((timeSlot, index) => {
                            const matchSlot = REGULAR_TIMINGS[index];
                            return (
                                <tr key={timeSlot} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {timeSlot}
                                    </td>
                                    {days.map(day => {
                                        const slotCourses = getCoursesForSlot(day, matchSlot);

                                        return (
                                            <td key={`${day}-${timeSlot}`} className="p-2 border-l border-gray-100 dark:border-gray-800 relative">
                                                {slotCourses.length > 0 && (
                                                    <div className="space-y-1">
                                                        {slotCourses.map((course, idx) => {
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
                                                                    className="p-2.5 rounded-r-lg rounded-l-[4px] transition-all duration-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] cursor-pointer flex flex-col justify-center min-h-[76px]"
                                                                    style={{
                                                                        backgroundColor: `${course.friendColor}25`,
                                                                        borderLeft: `4px solid ${course.friendColor}`
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
                                                                    onMouseLeave={() => {
                                                                        setHoveredCourse(null);
                                                                        setHoveredCourseTitle(null);
                                                                    }}
                                                                >
                                                                    <div className="font-bold text-sm tracking-tight leading-tight flex items-center gap-1.5 text-gray-900 dark:text-white">
                                                                        {course.courseCode}{isLab && 'L'}
                                                                        <span className="text-xs uppercase font-black px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/20 text-gray-900 dark:text-gray-100 shadow-sm">{course.sectionName}</span>
                                                                    </div>

                                                                    <div className="text-xs font-medium mt-1.5 flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                                                        <svg className="w-3 h-3 opacity-80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                        <span className="truncate">{course.friendName}</span>
                                                                    </div>

                                                                    {course.roomName && (
                                                                        <div className="text-[11px] mt-0.5 flex flex-col gap-0.5 font-bold text-gray-700 dark:text-gray-300">
                                                                            <div className="flex items-start gap-1">
                                                                                <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                </svg>
                                                                                <div className="flex flex-col">
                                                                                    {(isLab ? course.labRoomName || course.labRoomNumber || course.roomName : course.roomName).split(';').map((part, i) => (
                                                                                        <div key={i} className="leading-tight">{part.trim()}</div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
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
            {/* Footer added back for export PNG purposes */}
            <div className="mt-4 text-center text-sm text-gray-500 export-only hidden" data-html2canvas-ignore="false">
                Made with 💖 from boracle.app
            </div>
        </div>
    );
};

export default MergedRoutineGrid;
