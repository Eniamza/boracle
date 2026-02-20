'use client';
import React, { useState, useMemo } from 'react';
import CourseBottomSheet from '@/components/ui/CourseBottomSheet';
import { getAdjustedTime } from '@/constants/routineTimings';

/**
 * Mobile day-view for merged routine grid.
 * Shows friend legend, scrollable day tabs, and vertical course cards
 * colored by the friend who owns each course.
 */
const MobileMergedRoutineView = ({
    courses = [],
    friends = [],
}) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Default to first day with courses
    const firstDayWithCourses = useMemo(() => {
        for (const day of days) {
            const hasCourse = courses.some(course => {
                const classMatch = course.sectionSchedule?.classSchedules?.some(s => s.day === day.toUpperCase());
                const labMatch = course.labSchedules?.some(s => s.day === day.toUpperCase());
                return classMatch || labMatch;
            });
            if (hasCourse) return day;
        }
        return 'Sunday';
    }, [courses]);

    const [selectedDay, setSelectedDay] = useState(firstDayWithCourses);
    const [bottomSheetCourse, setBottomSheetCourse] = useState(null);
    const [bottomSheetTitle, setBottomSheetTitle] = useState(null);

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

    // Get courses for the selected day, sorted by time
    const coursesForDay = useMemo(() => {
        const result = [];
        const seen = new Set();

        courses.forEach(course => {
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

        // Sort by time
        result.sort((a, b) => a.sortKey - b.sortKey);

        // Detect conflicts
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
    }, [courses, selectedDay]);

    // Count per day
    const coursesPerDay = useMemo(() => {
        const counts = {};
        days.forEach(day => {
            let count = 0;
            courses.forEach(course => {
                const classMatch = course.sectionSchedule?.classSchedules?.some(s => s.day === day.toUpperCase());
                const labMatch = course.labSchedules?.some(s => s.day === day.toUpperCase());
                if (classMatch || labMatch) count++;
            });
            counts[day] = count;
        });
        return counts;
    }, [courses]);

    /**
     * Lighten a hex color for backgrounds.
     * Returns an rgba string with the given alpha.
     */
    const colorWithAlpha = (hex, alpha = 0.15) => {
        if (!hex) return 'rgba(107,114,128,0.15)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    return (
        <div className="w-full">
            {/* Friend Legend */}
            <div className="flex flex-wrap gap-2 px-2 pb-2">
                {friends.map(friend => (
                    <div key={friend.id} className="flex items-center gap-1.5">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: friend.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{friend.friendName}</span>
                    </div>
                ))}
            </div>

            {/* Day Tabs - sticky */}
            <div className="flex overflow-x-auto gap-1.5 pb-3 pt-1 px-1 scrollbar-hide sticky top-0 z-10 bg-white dark:bg-gray-900">
                {days.map((day, idx) => {
                    const isSelected = selectedDay === day;
                    const count = coursesPerDay[day];
                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all relative ${isSelected
                                ? 'bg-purple-600 text-white shadow-md'
                                : count > 0
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {dayAbbr[idx]}
                            {count > 0 && !isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Course Cards */}
            <div className="space-y-2.5 mt-1 px-1">
                {coursesForDay.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                        <div className="text-3xl mb-2">☕</div>
                        <div className="text-sm">No classes on {selectedDay}</div>
                    </div>
                ) : (
                    coursesForDay.map((entry, idx) => {
                        const { course, type, startTime, endTime, room, hasConflict } = entry;
                        const isLab = type === 'lab';
                        const friendColor = course.friendColor || '#6B7280';

                        return (
                            <div
                                key={`${course.sectionId}-${type}-${idx}`}
                                className="rounded-xl p-3.5 border transition-all active:scale-[0.98]"
                                style={{
                                    backgroundColor: hasConflict
                                        ? 'rgba(239,68,68,0.08)'
                                        : colorWithAlpha(friendColor, 0.1),
                                    borderColor: hasConflict
                                        ? 'rgba(239,68,68,0.4)'
                                        : colorWithAlpha(friendColor, 0.35),
                                }}
                                onClick={() => {
                                    setBottomSheetCourse(course);
                                    setBottomSheetTitle(`${course.courseCode}${isLab ? 'L' : ''}`);
                                }}
                            >
                                {/* Time */}
                                <div
                                    className="text-xs font-mono font-medium mb-1.5"
                                    style={{ color: hasConflict ? '#EF4444' : friendColor }}
                                >
                                    {getAdjustedTime(formatTime(startTime))} – {getAdjustedTime(formatTime(endTime))}
                                    {hasConflict && <span className="ml-2 text-red-500 font-bold">⚠ Conflict</span>}
                                </div>

                                {/* Course info */}
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

                                    {/* Friend badge */}
                                    <span
                                        className="ml-2 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: colorWithAlpha(friendColor, 0.2),
                                            color: friendColor,
                                            border: `1px solid ${colorWithAlpha(friendColor, 0.4)}`,
                                        }}
                                    >
                                        {course.friendName}
                                    </span>
                                </div>

                                {/* Lab badge */}
                                {isLab && (
                                    <span
                                        className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: colorWithAlpha(friendColor, 0.2),
                                            color: friendColor,
                                        }}
                                    >
                                        Lab
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
                {/* Extra bottom padding to ensure scroll clearance */}
                <div className="h-6" aria-hidden="true"></div>
            </div>



            {/* Bottom Sheet */}
            <CourseBottomSheet
                course={bottomSheetCourse}
                courseTitle={bottomSheetTitle}
                extraFields={bottomSheetCourse ? [{ label: 'Friend', value: bottomSheetCourse.friendName }] : []}
                onClose={() => {
                    setBottomSheetCourse(null);
                    setBottomSheetTitle(null);
                }}
            />
        </div>
    );
};

export default MobileMergedRoutineView;
