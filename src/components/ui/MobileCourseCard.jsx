'use client';
import React from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Mobile card layout for a single course in the PrePreReg table.
 * Replaces the 10-column table row on mobile viewports.
 */
const MobileCourseCard = ({
    course,
    isSelected,
    onToggle,
    onCardTap,
    formatTime,
    formatSchedule,
}) => {
    const availableSeats = course.capacity - course.consumedSeat;
    const fillPercent = course.capacity > 0 ? (course.consumedSeat / course.capacity) * 100 : 0;

    // Seat badge color based on availability
    const seatColor = availableSeats <= 0
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
        : fillPercent >= 80
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';

    const classSchedules = course.sectionSchedule?.classSchedules || [];
    const labSchedules = course.labSchedules || [];

    return (
        <div
            className={`rounded-xl border p-3.5 transition-all active:scale-[0.98] ${isSelected
                ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
            onClick={() => onCardTap?.(course)}
        >
            {/* Top Row: Course code + Seat badge */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base text-gray-900 dark:text-gray-100">
                        {course.courseCode}-[{course.sectionName}]
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {course.faculties || 'TBA'}
                    </div>
                </div>

                {/* Seat Badge */}
                <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${seatColor}`}>
                    {course.consumedSeat}/{course.capacity}
                </div>
            </div>

            {/* Schedule Row */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
                {classSchedules.map((s, idx) => (
                    <span key={`cls-${idx}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span className="font-semibold">{s.day?.slice(0, 3)}</span>
                        <span className="text-blue-500 dark:text-blue-400">{formatTime(s.startTime)}-{formatTime(s.endTime)}</span>
                    </span>
                ))}
                {labSchedules.map((s, idx) => (
                    <span key={`lab-${idx}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <span className="font-semibold">{s.day?.slice(0, 3)}</span>
                        <span className="text-purple-500 dark:text-purple-400">{formatTime(s.startTime)}-{formatTime(s.endTime)}</span>
                        <span className="text-[10px] font-bold uppercase">Lab</span>
                    </span>
                ))}
            </div>

            {/* Bottom Row: Exam + Action */}
            <div className="mt-2.5 flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {course.sectionSchedule?.finalExamDetail ? (
                        <span>📅 {course.sectionSchedule.finalExamDetail}</span>
                    ) : (
                        <span>Exam: TBA</span>
                    )}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(course); }}
                    className={`p-2 rounded-lg transition-colors ${isSelected
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-white hover:bg-green-600 hover:border-green-600 hover:text-white'
                        }`}
                >
                    {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default MobileCourseCard;
