'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAdjustedTime } from '@/constants/routineTimings';

/**
 * Mobile bottom-sheet component that slides up from the bottom.
 * Replaces CourseHoverTooltip on mobile viewports.
 *
 * @param {object|null} course - The course object to display
 * @param {Function} onClose - Called when the sheet should close
 * @param {string} [courseTitle] - Optional display title override
 * @param {Array<{ label: string, value: any }>} [extraFields] - Optional additional rows
 */
const CourseBottomSheet = ({ course, onClose, courseTitle, extraFields = [] }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [displayCourse, setDisplayCourse] = useState(null);
    const [activeTitle, setActiveTitle] = useState(null);
    const scrollYRef = React.useRef(0);

    const lockScroll = () => {
        scrollYRef.current = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollYRef.current}px`;
        document.body.style.width = '100%';
    };

    const unlockScroll = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollYRef.current);
    };

    useEffect(() => {
        if (course) {
            setDisplayCourse(course);
            setActiveTitle(courseTitle);
            const timer = setTimeout(() => setIsVisible(true), 20);
            lockScroll();
            // Push history state when opening
            window.history.pushState({ modalOpen: true }, '');
            return () => clearTimeout(timer);
        } else if (displayCourse) {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setDisplayCourse(null);
                setActiveTitle(null);
                unlockScroll();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [course, courseTitle]);

    // Handle back button
    useEffect(() => {
        const handlePopState = (event) => {
            if (isVisible) {
                // Prevent default back navigation if modal is open
                handleClose();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isVisible]);

    const handleClose = () => {
        // Pop history state if it was pushed
        if (window.history.state?.modalOpen) {
            window.history.back();
            // The popstate listener will trigger the actual close logic, but to be safe/smooth:
        }

        setIsVisible(false);
        setTimeout(() => {
            setDisplayCourse(null);
            setActiveTitle(null);
            unlockScroll();
            onClose?.();
        }, 200);
    };

    if (!displayCourse) return null;

    const activeCourse = displayCourse;

    const formatDay = (day) => {
        if (!day) return '';
        return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    };

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

    const displayTitle = activeTitle || `${activeCourse.courseCode}`;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => {
                    if (window.history.state?.modalOpen) {
                        window.history.back();
                    } else {
                        handleClose();
                    }
                }}
            />

            {/* Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl transform transition-transform duration-200 ease-out max-h-[85vh] overflow-y-auto ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Close button */}
                <button
                    onClick={() => {
                        if (window.history.state?.modalOpen) {
                            window.history.back();
                        } else {
                            handleClose();
                        }
                    }}
                    className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Content */}
                <div className="px-5 pb-6 pt-2 space-y-3">
                    {/* Header */}
                    <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center justify-between pr-8">
                            <span>{displayTitle} - {activeCourse.sectionName}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                {activeCourse.courseCredit || 0} Credits
                            </span>
                        </div>
                    </div>

                    {/* Extra fields */}
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
                                <span className="font-medium text-gray-900 dark:text-gray-200">{activeCourse.faculties || 'TBA'}</span>
                            </div>
                            {activeCourse.employeeName && (
                                <div className="text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 block text-xs">Name</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{activeCourse.employeeName}</span>
                                </div>
                            )}
                            {activeCourse.employeeEmail && (
                                <div className="text-sm">
                                    <a href={`mailto:${activeCourse.employeeEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all block">
                                        {activeCourse.employeeEmail}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Faculty Image */}
                        <div className="shrink-0 pt-1">
                            {activeCourse.imgUrl && activeCourse.imgUrl !== 'N/A' && !activeCourse.imageError ? (
                                <img
                                    src={activeCourse.imgUrl}
                                    alt={activeCourse.faculties || 'Faculty'}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800"
                                style={{ display: activeCourse.imgUrl && activeCourse.imgUrl !== 'N/A' && !activeCourse.imageError ? 'none' : 'flex' }}
                            >
                                <svg className="w-8 h-8 text-blue-400 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Class Schedule */}
                    <div className="space-y-2">
                        {activeCourse.sectionSchedule?.classSchedules?.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5 border border-orange-200 dark:border-orange-800/30">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Class Schedule</span>
                                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-white dark:bg-orange-900/40 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/50 shadow-sm">
                                        Room: {activeCourse.roomName || 'TBA'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {activeCourse.sectionSchedule.classSchedules.map((sched, idx) => (
                                        <div key={`cls-${idx}`} className="flex justify-between text-xs">
                                            <span className="font-bold text-gray-900 dark:text-gray-100 w-16">{formatDay(sched.day)}</span>
                                            <span className="font-mono font-medium text-gray-900 dark:text-gray-200 text-right flex-1">{getAdjustedTime(formatTime(sched.startTime))} - {getAdjustedTime(formatTime(sched.endTime))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeCourse.labSchedules?.length > 0 && (
                            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2.5 border border-teal-200 dark:border-teal-800/30">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Lab Schedule</span>
                                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-teal-900/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/50 shadow-sm">
                                        Room: {activeCourse.labRoomName || 'TBA'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {activeCourse.labSchedules.map((sched, idx) => (
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
                            <span className="text-gray-900 dark:text-gray-200">{displayTitle.endsWith('L') ? 'LAB' : activeCourse.sectionType === 'OTHER' ? 'THEORY' : activeCourse.sectionType}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs block">Capacity</span>
                            <span className="text-gray-900 dark:text-gray-200">{activeCourse.consumedSeat || 0} / {activeCourse.capacity || 0}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400 text-xs block">Prerequisites</span>
                            <span className="text-gray-900 dark:text-gray-200">{activeCourse.prerequisiteCourses || 'None'}</span>
                        </div>
                    </div>

                    {/* Exam Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800/30">
                        <div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium block">Mid Exam</span>
                            <span className="text-gray-700 dark:text-gray-300">{activeCourse.sectionSchedule?.midExamDetail || 'TBA'}</span>
                        </div>
                        <div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium block">Final Exam</span>
                            <span className="text-gray-700 dark:text-gray-300">{activeCourse.sectionSchedule?.finalExamDetail || 'TBA'}</span>
                        </div>
                    </div>

                    <div className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
                        {activeCourse.sectionSchedule?.classStartDate} to {activeCourse.sectionSchedule?.classEndDate}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseBottomSheet;
