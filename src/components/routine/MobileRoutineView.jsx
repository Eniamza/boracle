'use client';
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import CourseBottomSheet from '@/components/ui/CourseBottomSheet';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';

/**
 * Mobile day-view for routine grid.
 * Shows scrollable day tabs + vertical course cards for the selected day.
 */
const MobileRoutineView = ({
    selectedCourses = [],
    onRemoveCourse = null,
    showRemoveButtons = true,
}) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Default to first day that has courses, otherwise Sunday
    const firstDayWithCourses = useMemo(() => {
        for (const day of days) {
            const hasCourse = selectedCourses.some(course => {
                const classMatch = course.sectionSchedule?.classSchedules?.some(s => s.day === day.toUpperCase());
                const labMatch = course.labSchedules?.some(s => s.day === day.toUpperCase());
                return classMatch || labMatch;
            });
            if (hasCourse) return day;
        }
        return 'Sunday';
    }, [selectedCourses]);

    const [selectedDay, setSelectedDay] = useState(firstDayWithCourses);
    const [bottomSheetCourse, setBottomSheetCourse] = useState(null);
    const [bottomSheetTitle, setBottomSheetTitle] = useState(null);

    const timeSlots = getRoutineTimings();

    const formatTime = (time) => {
        if (!time) return '';
        if (time.includes('AM') || time.includes('PM')) return time;
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        if (isNaN(hour)) return time;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
        return totalMinutes;
    };

    // Get all courses for the selected day, with their time info
    const coursesForDay = useMemo(() => {
        const result = [];
        const seen = new Set();

        selectedCourses.forEach(course => {
            // Class schedules
            course.sectionSchedule?.classSchedules?.forEach(schedule => {
                if (schedule.day === selectedDay.toUpperCase()) {
                    const key = `${course.sectionId}-class-${schedule.startTime}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        result.push({
                            course,
                            type: 'class',
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            room: course.roomName || course.roomNumber || 'TBA',
                            sortKey: timeToMinutes(formatTime(schedule.startTime)),
                        });
                    }
                }
            });

            // Lab schedules
            course.labSchedules?.forEach(schedule => {
                if (schedule.day === selectedDay.toUpperCase()) {
                    const key = `${course.sectionId}-lab-${schedule.startTime}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        result.push({
                            course,
                            type: 'lab',
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            room: course.labRoomName || course.labRoomNumber || 'TBA',
                            sortKey: timeToMinutes(formatTime(schedule.startTime)),
                        });
                    }
                }
            });
        });

        // Sort by start time
        result.sort((a, b) => a.sortKey - b.sortKey);

        // Detect conflicts (overlapping times)
        for (let i = 0; i < result.length; i++) {
            const aStart = result[i].sortKey;
            const aEnd = timeToMinutes(formatTime(result[i].endTime));
            result[i].hasConflict = false;

            for (let j = 0; j < result.length; j++) {
                if (i === j) continue;
                const bStart = result[j].sortKey;
                const bEnd = timeToMinutes(formatTime(result[j].endTime));
                if (aStart < bEnd && aEnd > bStart) {
                    result[i].hasConflict = true;
                    break;
                }
            }
        }

        return result;
    }, [selectedCourses, selectedDay]);

    // Count courses per day for badge
    const coursesPerDay = useMemo(() => {
        const counts = {};
        days.forEach(day => {
            let count = 0;
            selectedCourses.forEach(course => {
                const classMatch = course.sectionSchedule?.classSchedules?.some(s => s.day === day.toUpperCase());
                const labMatch = course.labSchedules?.some(s => s.day === day.toUpperCase());
                if (classMatch || labMatch) count++;
            });
            counts[day] = count;
        });
        return counts;
    }, [selectedCourses]);

    return (
        <div className="w-full">
            {/* Day Tabs - sticky at top */}
            <div className="flex overflow-x-auto gap-1.5 pb-3 pt-2 px-1 scrollbar-hide sticky top-0 z-10 bg-white dark:bg-gray-900">
                {days.map((day, idx) => {
                    const isSelected = selectedDay === day;
                    const count = coursesPerDay[day];
                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all relative ${isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : count > 0
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {dayAbbr[idx]}
                            {count > 0 && !isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Course Cards for Selected Day */}
            <div className="space-y-2.5 mt-1">
                {coursesForDay.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                        <div className="text-3xl mb-2">☕</div>
                        <div className="text-sm">No classes on {selectedDay}</div>
                    </div>
                ) : (
                    coursesForDay.map((entry, idx) => {
                        const { course, type, startTime, endTime, room, hasConflict } = entry;
                        const isLab = type === 'lab';

                        return (
                            <div
                                key={`${course.sectionId}-${type}-${idx}`}
                                className={`rounded-xl p-3.5 border transition-all active:scale-[0.98] ${hasConflict
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                    : isLab
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                    }`}
                                onClick={() => {
                                    setBottomSheetCourse(course);
                                    setBottomSheetTitle(`${course.courseCode}${isLab ? 'L' : ''}`);
                                }}
                            >
                                {/* Time */}
                                <div className={`text-xs font-mono font-medium mb-1.5 ${hasConflict
                                    ? 'text-red-600 dark:text-red-400'
                                    : isLab
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {formatTime(startTime)} – {formatTime(endTime)}
                                    {hasConflict && <span className="ml-2 text-red-500 font-bold">⚠ Conflict</span>}
                                </div>

                                {/* Course info row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                            {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                            <span>📍 {room}</span>
                                            {course.faculties && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                                    <span>👤 {course.faculties}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remove button */}
                                    {showRemoveButtons && onRemoveCourse && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveCourse(course);
                                            }}
                                            className="ml-2 p-2 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors flex-shrink-0"
                                        >
                                            <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                                        </button>
                                    )}
                                </div>

                                {/* Lab badge */}
                                {isLab && (
                                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300">
                                        Lab
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Color Legend */}
            {selectedCourses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-600 rounded" />
                        <span className="text-gray-500 dark:text-gray-400">Class</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900/50 border border-purple-400 dark:border-purple-600 rounded" />
                        <span className="text-gray-500 dark:text-gray-400">Lab</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 rounded" />
                        <span className="text-gray-500 dark:text-gray-400">Conflict</span>
                    </div>
                </div>
            )}

            {/* Bottom Sheet */}
            <CourseBottomSheet
                course={bottomSheetCourse}
                courseTitle={bottomSheetTitle}
                onClose={() => {
                    setBottomSheetCourse(null);
                    setBottomSheetTitle(null);
                }}
            />
        </div>
    );
};

export default MobileRoutineView;
