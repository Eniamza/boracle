'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, RefreshCw, AlertCircle, Copy, Check, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RoutineView from '@/components/routine/RoutineView';
import { copyToClipboard } from '@/lib/utils';
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';
import { toast } from 'sonner';

import { useIsMobile } from '@/hooks/use-mobile';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { useFaculty } from '@/app/contexts/FacultyContext';

const SharedRoutinePage = () => {
    const { id } = useParams();
    const { data: session } = useSession();
    const [routine, setRoutine] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const routineRef = useRef(null);
    const exportRef = useRef(null);
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (id) {
            fetchRoutine();
        }
    }, [id]);

    const { getFacultyDetails } = useFaculty();

    const fetchRoutine = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/routine/${id}`);

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

            // Decode routineStr and fetch course data
            const sectionIds = JSON.parse(atob(data.routine.routineStr));

            const coursesResponse = await fetch('https://usis-cdn.eniamza.com/connect.json');
            const allCourses = await coursesResponse.json();

            const matchedCourses = allCourses
                .filter(course => sectionIds.includes(course.sectionId))
                .map(course => ({
                    ...course,
                    employeeName: getFacultyDetails(course.faculties).facultyName,
                    employeeEmail: getFacultyDetails(course.faculties).facultyEmail,
                    imgUrl: getFacultyDetails(course.faculties).imgUrl,
                }));

            setCourses(matchedCourses);
        } catch (err) {
            console.error('Error fetching shared routine:', err);
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
            const response = await fetch('/api/routine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routineStr: routine.routineStr,
                    email: session.user.email,
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
        // Use hidden exportRef on mobile, otherwise normal routineRef
        const ref = (isMobile && exportRef.current) ? exportRef : routineRef;

        if (!ref.current) return;

        await exportRoutineToPNG({
            routineRef: ref,
            filename: `shared-routine-${id.slice(0, 8)}`,
            showToast: false,
        });
    };



    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading shared routine...</p>
            </div>
        );
    }

    // Error states
    if (error === 'not_found') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Routine Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    The routine you're looking for doesn't exist or may have been deleted. Check the routine ID and try again.
                </p>
                <a
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
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
                    We couldn't load this routine. Please try again later.
                </p>
                <button
                    onClick={() => fetchRoutine()}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-4 sm:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {routine?.ownerName
                                        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Routine`
                                        : 'Shared Routine'}
                                </h1>
                                {/* Copy ID button — matching saved routines page pattern */}
                                <button
                                    onClick={copyRoutineId}
                                    className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copied
                                        ? 'text-green-500 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                                        }`}
                                >
                                    <code className={`px-2 py-0.5 rounded font-mono ${copied
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                        }`}>{id}</code>
                                    <span className="flex items-center gap-1">
                                        {copied ? 'Copied' : 'Copy'}
                                        {copied ? (
                                            <Check className="w-3 h-3" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </span>
                                </button>
                                <div className="flex items-center gap-2 mt-1.5">
                                    {routine?.createdAt && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(Number(routine.createdAt) * 1000).toLocaleString()}
                                        </p>
                                    )}
                                    {routine?.semester && (
                                        <span className="inline-block bg-blue-100 dark:bg-blue-800/80 text-blue-700 dark:text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                                            {routine.semester}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {courses.length} course{courses.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {/* Import Routine button — only show if logged in */}
                            {session?.user?.email && (
                                <button
                                    onClick={importRoutine}
                                    disabled={importing || imported}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${imported
                                        ? 'bg- text-white cursor-default'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        } disabled:opacity-70`}
                                >
                                    {imported ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Imported
                                        </>
                                    ) : importing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Import Routine
                                        </>
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
                <RoutineView
                    title={`${routine?.ownerName
                        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Routine`
                        : 'Shared Routine'}`}
                    courses={courses}
                    isModal={false}
                    routineRefProp={routineRef}
                    showExportButton={false}
                    headerExtras={
                        <div className="flex items-center gap-2 mt-1">
                            {routine?.createdAt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Created {new Date(Number(routine.createdAt) * 1000).toLocaleDateString()}
                                </p>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                • {courses.length} course{courses.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    }
                />
            </div>

            {/* Hidden Desktop Table for Export - matching SharedMergedRoutinePage pattern */}
            {mounted && isMobile && (
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
                    <div ref={exportRef}>
                        <RoutineTableGrid
                            selectedCourses={courses}
                            showRemoveButtons={false}
                            forceDesktop={true}
                            className=""
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedRoutinePage;
