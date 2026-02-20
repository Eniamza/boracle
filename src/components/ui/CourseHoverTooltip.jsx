import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAdjustedTime } from '@/constants/routineTimings';

/**
 * Reusable course hover tooltip component.
 * Displays detailed course information in a fixed-position tooltip.
 *
 * @param {object|null} course - The course object to display info for (renders nothing when null)
 * @param {{ x: number, y: number }} position - Screen coordinates for tooltip positioning (viewport relative)
 * @param {Array<{ label: string, value: any }>} [extraFields] - Optional additional rows to display (e.g. Friend name)
 */
const CourseHoverTooltip = ({ course: propCourse, position: propPosition, courseTitle: propCourseTitle, extraFields: propExtraFields = [] }) => {
    // Hydration fix: ensure window usage is safe
    const [mounted, setMounted] = useState(false);
    const tooltipRef = useRef(null);
    const [tooltipHeight, setTooltipHeight] = useState(0);

    const [course, setCourse] = useState(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [courseTitle, setCourseTitle] = useState(null);
    const [extraFields, setExtraFields] = useState([]);
    const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
    const closeTimeoutRef = useRef(null);

    useEffect(() => {
        if (propCourse) {
            setCourse(propCourse);
            if (propPosition) setPosition(propPosition);
            setCourseTitle(propCourseTitle);
            setExtraFields(propExtraFields);
        }

        if (propCourse || isHoveringTooltip) {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        } else {
            closeTimeoutRef.current = setTimeout(() => {
                setCourse(null);
            }, 100);
        }

        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [propCourse, propPosition, propCourseTitle, propExtraFields, isHoveringTooltip]);

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
        pointerEvents: 'auto'
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

    // console.log("Course Title", courseTitle);
    const formatDay = (day) => {
        if (!day) return '';
        return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    };

    const formatTime = (time) => {
        if (!time) return '';
        // If already has AM/PM, return as is
        if (time.includes('AM') || time.includes('PM')) return time;

        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        if (isNaN(hour)) return time;

        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const displayTitle = courseTitle || `${course.courseCode}`;

    return createPortal(
        <div
            ref={tooltipRef}
            onMouseEnter={() => setIsHoveringTooltip(true)}
            onMouseLeave={() => setIsHoveringTooltip(false)}
            className="fixed z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 shadow-2xl text-left transition-opacity duration-75"
            style={style}
        >
            <div className="space-y-3">
                {/* Header */}
                <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span>{displayTitle} - {course.sectionName}</span>
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
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex gap-4 items-start">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faculty Information</div>
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Initial</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{course.faculties || 'TBA'}</span>
                        </div>
                        {course.employeeName && (
                            <div className="text-sm">
                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Name</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200 truncate block" title={course.employeeName}>
                                    {course.employeeName}
                                </span>
                            </div>
                        )}
                        {course.employeeEmail && (
                            <div className="text-sm">
                                <a href={`mailto:${course.employeeEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all block">
                                    {course.employeeEmail}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Faculty Image */}
                    <div className="shrink-0 pt-1">
                        {course.imgUrl && course.imgUrl !== 'N/A' && !course.imageError ? (
                            <img
                                src={course.imgUrl}
                                alt={course.faculties || 'Faculty'}
                                className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800"
                            style={{ display: course.imgUrl && course.imgUrl !== 'N/A' && !course.imageError ? 'none' : 'flex' }}
                        >
                            <svg className="w-8 h-8 text-blue-400 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Class Schedule */}
                <div className="space-y-2">
                    {/* Theory Schedule */}
                    {course.sectionSchedule?.classSchedules?.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5 border border-orange-200 dark:border-orange-800/30">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Class Schedule</span>
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-white dark:bg-orange-900/40 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/50 shadow-sm">
                                    Room: {course.roomName || 'TBA'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {course.sectionSchedule.classSchedules.map((sched, idx) => (
                                    <div key={`cls-${idx}`} className="flex justify-between text-xs">
                                        <span className="font-bold text-gray-900 dark:text-gray-100 w-16">{formatDay(sched.day)}</span>
                                        <span className="font-mono font-medium text-gray-900 dark:text-gray-200 text-right flex-1">{getAdjustedTime(formatTime(sched.startTime))} - {getAdjustedTime(formatTime(sched.endTime))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lab Schedule */}
                    {course.labSchedules?.length > 0 && (
                        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2.5 border border-teal-200 dark:border-teal-800/30">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Lab Schedule</span>
                                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-teal-900/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/50 shadow-sm">
                                    Room: {course.labRoomName || 'TBA'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {course.labSchedules.map((sched, idx) => (
                                    <div key={`lab-${idx}`} className="flex justify-between text-xs">
                                        <span className="font-bold text-gray-900 dark:text-gray-100 w-16">{formatDay(sched.day)}</span>
                                        <span className="font-mono font-medium text-gray-900 dark:text-gray-200 text-right flex-1">{getAdjustedTime(formatTime(sched.startTime))} - {getAdjustedTime(formatTime(sched.endTime))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Type</span>
                        <span className="text-gray-900 dark:text-gray-200">{displayTitle.endsWith('L') ? 'LAB' : course.sectionType === 'OTHER' ? 'THEORY' : course.sectionType}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Capacity</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.consumedSeat || 0} / {course.capacity || 0}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Prerequisites</span>
                        <span className="text-gray-900 dark:text-gray-200">{course.prerequisiteCourses || 'None'}</span>
                    </div>
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
        </div>,
        document.body
    );
};

export default CourseHoverTooltip;
