'use client';
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

/**
 * Reusable course hover tooltip component.
 * Displays detailed course information in a fixed-position tooltip.
 *
 * @param {object|null} course - The course object to display info for (renders nothing when null)
 * @param {{ x: number, y: number }} position - Screen coordinates for tooltip positioning (viewport relative)
 * @param {Array<{ label: string, value: any }>} [extraFields] - Optional additional rows to display (e.g. Friend name)
 */
const CourseHoverTooltip = ({ course, position, extraFields = [] }) => {
    // Hydration fix: ensure window usage is safe
    const [mounted, setMounted] = useState(false);
    const tooltipRef = useRef(null);
    const [tooltipHeight, setTooltipHeight] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Measure height whenever course changes or mounting
    useLayoutEffect(() => {
        if (tooltipRef.current) {
            setTooltipHeight(tooltipRef.current.offsetHeight);
        }
    }, [course, mounted]);

    if (!course || !mounted) return null;

    // Viewport-aware positioning constants
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 384; // w-96 = 384px

    // Clamp horizontal position to keep within viewport
    // We assume the caller has already decided whether to place it left or right of the cursor/element
    // and passed the appropriate 'x' coordinate (left edge of the tooltip).
    const leftPos = Math.max(10, Math.min(position.x, viewportWidth - tooltipWidth - 10));

    // Vertical positioning logic
    // If tooltip height is known and would overflow bottom, align to bottom edge instead
    const wouldOverflowBottom = tooltipHeight > 0 && (position.y + tooltipHeight + 20 > viewportHeight);

    // Calculate final style based on overflow check
    const style = {
        left: `${leftPos}px`,
        width: `${tooltipWidth}px`,
        maxHeight: '90vh',
        overflowY: 'auto',
        // Start invisible until measured to prevent jump
        opacity: tooltipHeight > 0 ? 1 : 0,
        pointerEvents: 'none'
    };

    if (wouldOverflowBottom) {
        // "Popup upward": Align bottom of tooltip to bottom of screen (with margin)
        // This ensures it grows upwards and stays visible
        style.bottom = '10px';
        style.top = 'auto';
    } else {
        // Default: Align top of tooltip to cursor/element Y position
        style.top = `${Math.max(10, position.y)}px`;
        style.bottom = 'auto';
    }

    return (
        <div
            ref={tooltipRef}
            className="fixed z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-2xl text-left transition-opacity duration-75"
            style={style}
        >
            <div className="space-y-3">
                {/* Header */}
                <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span>{course.courseCode} - {course.sectionName}</span>
                        {/* Credits Badge */}
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            {course.courseCredit || 0} Credits
                        </span>
                    </div>
                </div>

                {/* Extra fields (e.g. Friend name for merged routines) */}
                {extraFields.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-100 dark:border-purple-800/30">
                        {extraFields.map((field, idx) => (
                            <div key={idx} className="text-sm">
                                <span className="text-purple-600 dark:text-purple-400 font-medium">{field.label}:</span>{' '}
                                <span className="text-gray-700 dark:text-gray-300">{field.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Faculty Information */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-1.5 border border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faculty Information</div>
                    <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Initial</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">{course.faculties || 'TBA'}</span>
                    </div>
                    {course.employeeName && (
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Name</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{course.employeeName}</span>
                        </div>
                    )}
                    {course.employeeEmail && (
                        <div className="text-sm">
                            <a href={`mailto:${course.employeeEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                                {course.employeeEmail}
                            </a>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Type</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.sectionType === 'OTHER' ? 'THEORY' : course.sectionType}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Capacity</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.consumedSeat || 0} / {course.capacity || 0}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Prerequisites</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.prerequisiteCourses || 'None'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Room</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.roomName || 'TBA'}</span>
                    </div>
                    {course.labCourseCode && (
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs block">Lab Room</span>
                            <span className="text-gray-900 dark:text-gray-200">{course.labRoomName || 'TBA'}</span>
                        </div>
                    )}
                </div>

                {/* Schedule Info */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800/30">
                    <div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium block">Mid Exam</span>
                        <span className="text-gray-700 dark:text-gray-300">{course.sectionSchedule?.midExamDetail || 'TBA'}</span>
                    </div>
                    <div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium block">Final Exam</span>
                        <span className="text-gray-700 dark:text-gray-300">{course.sectionSchedule?.finalExamDetail || 'TBA'}</span>
                    </div>
                </div>

                <div className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
                    {course.sectionSchedule?.classStartDate} to {course.sectionSchedule?.classEndDate}
                </div>
            </div>
        </div>
    );
};

export default CourseHoverTooltip;
