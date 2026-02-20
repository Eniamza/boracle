'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, RefreshCw, AlertCircle, Copy, Check, Save, Users, X } from 'lucide-react';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMergedRoutineView from '@/components/routine/MobileMergedRoutineView';
import { useFaculty } from '@/app/contexts/FacultyContext';

const SharedMergedRoutinePage = () => {
    const { id } = useParams();
    const { data: session } = useSession();
    const [routine, setRoutine] = useState(null);
    const [courses, setCourses] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const routineRef = useRef(null);
    const exportRef = useRef(null);
    const [hoveredCourse, setHoveredCourse] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const colorPalette = [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
        '#10B981', '#EF4444', '#6366F1', '#14B8A6',
        '#F97316', '#06B6D4', '#84CC16', '#E879F9',
        '#0EA5E9',
    ];



    const timeSlots = getRoutineTimings();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const { getFacultyDetails } = useFaculty();

    useEffect(() => {
        if (id) fetchRoutine();
    }, [id]);

    // Time conversion utilities - matching the modal exactly
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

    // Get courses for a specific slot - matching the modal exactly
    const getCoursesForSlot = (day, timeSlot) => {
        const [slotStart, slotEnd] = timeSlot.split('-');
        const slotStartMin = timeToMinutes(slotStart);
        const slotEndMin = timeToMinutes(slotEnd);

        return courses.filter(course => {
            const classMatch = course.sectionSchedule?.classSchedules?.some(schedule => {
                if (schedule.day !== day.toUpperCase()) return false;
                const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
                const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
            });

            const labMatch = course.labSchedules?.some(schedule => {
                if (schedule.day !== day.toUpperCase()) return false;
                const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
                const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
            });

            return classMatch || labMatch;
        });
    };

    const fetchRoutine = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/merged-routine/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('not_found');
                } else {
                    setError('fetch_failed');
                }
                return;
            }

            const data = await response.json();

            if (!data.success) {
                setError('fetch_failed');
                return;
            }

            setRoutine(data.routine);

            // Parse routineData - matching the viewMergedRoutine function exactly
            const routineData = JSON.parse(data.routine.routineData);

            const friendsData = routineData.map((item, index) => ({
                id: index,
                friendName: item.friendName,
                color: colorPalette[index % colorPalette.length],
                sectionIds: item.sectionIds || []
            }));

            setFriends(friendsData);

            const allSectionIds = routineData.flatMap(item => item.sectionIds || []);

            // Fetch course data from the CDN
            const coursesResponse = await fetch('https://usis-cdn.eniamza.com/connect.json');
            const allCourses = await coursesResponse.json();

            // Filter and attach friend info + faculty enrichment
            const matchedCourses = allCourses
                .filter(course => allSectionIds.includes(course.sectionId))
                .map(course => {
                    const friend = friendsData.find(f => f.sectionIds.includes(course.sectionId));
                    return {
                        ...course,
                        friendName: friend?.friendName || 'Unknown',
                        friendColor: friend?.color || '#6B7280',
                        employeeName: getFacultyDetails(course.faculties).facultyName,
                        employeeEmail: getFacultyDetails(course.faculties).facultyEmail,
                        imgUrl: getFacultyDetails(course.faculties).imgUrl,
                    };
                });

            setCourses(matchedCourses);
        } catch (err) {
            console.error('Error fetching shared merged routine:', err);
            setError('fetch_failed');
        } finally {
            setLoading(false);
        }
    };

    const copyRoutineId = async () => {
        const success = await copyToClipboard(id);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            toast.success('Routine ID copied!');
        } else {
            toast.error('Failed to copy ID');
        }
    };

    const importRoutine = async () => {
        if (!session?.user?.email) return;

        try {
            setImporting(true);
            const response = await fetch('/api/merged-routine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routineData: routine.routineData,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setImported(true);
            } else {
                alert('Failed to import routine. Please try again.');
            }
        } catch (err) {
            console.error('Error importing routine:', err);
            alert('Failed to import routine. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const exportToPNG = async () => {
        if (!courses || courses.length === 0) return;

        // Use hidden exportRef on mobile, otherwise normal routineRef
        const ref = (isMobile && exportRef.current) ? exportRef : routineRef;

        if (!ref.current) {
            toast.error('Routine table not found');
            return;
        }

        await exportRoutineToPNG({
            routineRef: ref,
            filename: `shared-merged-routine-${id.slice(0, 8)}`,
            showToast: false,
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading shared merged routine...</p>
            </div>
        );
    }

    // Error states
    if (error === 'not_found') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Merged Routine Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    The merged routine you&apos;re looking for doesn&apos;t exist or may have been deleted.
                </p>
                <a href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Go Home
                </a>
            </div>
        );
    }

    if (error === 'fetch_failed') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Something Went Wrong</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    We couldn&apos;t load this merged routine. Please try again later.
                </p>
                <button
                    onClick={() => fetchRoutine()}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-purple-800/50 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="p-2.5 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {routine?.ownerName
                                        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Merged Routine`
                                        : 'Shared Merged Routine'}
                                </h1>
                                {/* Copy ID button */}
                                <button
                                    onClick={copyRoutineId}
                                    className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copied
                                        ? 'text-green-500 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400'
                                        }`}
                                >
                                    <code className={`px-2 py-0.5 rounded font-mono ${copied
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                        }`}>{id}</code>
                                    <span className="flex items-center gap-1">
                                        {copied ? 'Copied' : 'Copy'}
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </span>
                                </button>
                                <div className="flex items-center gap-2 mt-1.5">
                                    {routine?.createdAt && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(Number(routine.createdAt) * 1000).toLocaleString()}
                                        </p>
                                    )}
                                    {routine?.semester && (
                                        <span className="inline-block bg-purple-100 dark:bg-purple-800/80 text-purple-700 dark:text-purple-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                                            {routine.semester}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {courses.length} course{courses.length !== 1 ? 's' : ''} • {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {session?.user?.email && (
                                <button
                                    onClick={importRoutine}
                                    disabled={importing || imported}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${imported
                                        ? 'bg-green-600 text-white cursor-default'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        } disabled:opacity-70`}
                                >
                                    {imported ? (
                                        <><Check className="w-4 h-4" /> Imported</>
                                    ) : importing ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Import Routine</>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={exportToPNG}
                                disabled={courses.length === 0}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white text-sm font-medium disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Save as PNG
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Routine Grid */}
            <div className="max-w-7xl mx-auto">
                {mounted && isMobile ? (
                    <>
                        {/* Mobile View */}
                        <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4'>
                            <MobileMergedRoutineView
                                courses={courses}
                                friends={friends}
                            />
                        </div>

                        {/* Hidden Desktop Table for Export */}
                        <div
                            style={{
                                position: 'fixed',
                                left: 0,
                                top: 0,
                                width: '1800px',
                                opacity: 0,
                                pointerEvents: 'none',
                                zIndex: -1,
                                overflow: 'visible',
                            }}
                            aria-hidden="true"
                        >
                            <div ref={exportRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
                                {/* Friend Legend */}
                                <div className="mb-4 flex flex-wrap gap-3">
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
                                    <table className="w-full border-collapse">
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
                                                                                        className="p-2 rounded text-xs"
                                                                                        style={{
                                                                                            backgroundColor: `${course.friendColor}30`,
                                                                                            borderLeft: `3px solid ${course.friendColor}`
                                                                                        }}
                                                                                    >
                                                                                        <div className="font-semibold">
                                                                                            {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                                                                        </div>
                                                                                        <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                                                                            {course.friendName}
                                                                                        </div>
                                                                                        {course.roomName && (
                                                                                            <div className="text-gray-500 dark:text-gray-500 text-xs">
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Watermark */}
                                <div className="text-center py-3 text-gray-500 dark:text-gray-600 text-xs">
                                    Made with 💖 from https://oracle.eniamza.com
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div ref={routineRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
                        {/* Friend Legend - same as modal */}
                        <div className="mb-4 flex flex-wrap gap-3">
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
                            <table className="w-full border-collapse">
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
                                                                        // Check if this slot is for a lab - matching modal exactly
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
                                                                                className="p-2 rounded text-xs transition-opacity hover:opacity-90 cursor-pointer"
                                                                                style={{
                                                                                    backgroundColor: `${course.friendColor}30`,
                                                                                    borderLeft: `3px solid ${course.friendColor}`
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    setHoveredCourse(course);
                                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                                    const viewportWidth = window.innerWidth;
                                                                                    const tooltipWidth = 384; // w-96 = 384px
                                                                                    const shouldShowLeft = rect.right + tooltipWidth + 10 > viewportWidth;

                                                                                    setTooltipPosition({
                                                                                        x: shouldShowLeft ? rect.left - tooltipWidth - 10 : rect.right + 10,
                                                                                        y: rect.top
                                                                                    });
                                                                                }}
                                                                                onMouseLeave={() => setHoveredCourse(null)}
                                                                            >
                                                                                <div className="font-semibold">
                                                                                    {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                                                                </div>
                                                                                <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                                                                    {course.friendName}
                                                                                </div>
                                                                                {course.roomName && (
                                                                                    <div className="text-gray-500 dark:text-gray-500 text-xs">
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Rich Tooltip - viewport-aware positioning */}
                        <CourseHoverTooltip
                            course={hoveredCourse}
                            position={tooltipPosition}
                            extraFields={hoveredCourse ? [{ label: 'Friend', value: hoveredCourse.friendName }] : []}
                        />

                        {/* Watermark */}
                        <div className="text-center py-3 text-gray-500 dark:text-gray-600 text-xs">
                            Made with 💖 from https://oracle.eniamza.com
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedMergedRoutinePage;
