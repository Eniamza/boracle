'use client';
import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Download } from 'lucide-react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';
import { useIsMobile } from '@/hooks/use-mobile';

const RoutineView = ({
    title = "Routine",
    courses = [],
    onClose,
    onSave,
    isSaving = false,
    onRemoveCourse,
    showRemoveButtons = false,
    headerExtras, // Slot for extra header content (e.g. credits count)
    isModal = true, // Whether to render as a modal or inline
    isOwner = false, // If true, shows save/edit controls generally (can be refined)
}) => {
    const routineRef = useRef(null);
    const exportRef = useRef(null); // Hidden desktop table for PNG export on mobile
    const isMobile = useIsMobile();
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Wait one frame before rendering modal content so useIsMobile resolves
    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    // Animate in on mount (same pattern as CourseBottomSheet)
    useEffect(() => {
        if (isModal && isMobile && mounted) {
            requestAnimationFrame(() => setIsVisible(true));
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModal, isMobile, mounted]);

    const handleClose = () => {
        if (isMobile && isModal) {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 250);
        } else {
            onClose?.();
        }
    };

    const handleExport = async () => {
        if (!courses || courses.length === 0) return;

        // On mobile, use the hidden desktop table ref for export
        const ref = isMobile ? exportRef : routineRef;
        if (!ref.current) return;

        await exportRoutineToPNG({
            routineRef: ref,
            filename: title.toLowerCase().replace(/\s+/g, '-'),
            showToast: true,
        });
    };

    // Desktop content (unchanged)
    const DesktopContent = (
        <div className={`${isModal ? 'bg-white dark:bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col shadow-xl' : 'w-full'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                    {headerExtras}
                </div>
                <div className="flex items-center gap-2">
                    {onSave && (
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Routine'}
                        </button>
                    )}

                    <button
                        onClick={handleExport}
                        disabled={courses.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Save as PNG
                    </button>

                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4" ref={routineRef}>
                <RoutineTableGrid
                    selectedCourses={courses}
                    showRemoveButtons={showRemoveButtons}
                    onRemoveCourse={onRemoveCourse}
                    className="h-full"
                />
            </div>
        </div>
    );

    // Mobile bottom-sheet content
    const MobileContent = (
        <>
            {/* Backdrop — tap to close */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-250 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Bottom sheet — slides up, 80% height (20% gap on top) */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-250 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '80vh', maxHeight: '80vh' }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h2>
                        {headerExtras}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onSave && (
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors"
                                title={isSaving ? 'Saving...' : 'Save Routine'}
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={handleExport}
                            disabled={courses.length === 0}
                            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                            title="Save as PNG"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleClose}
                            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid — scrollable */}
                <div className="flex-1 overflow-auto px-3 pt-3 pb-4" ref={routineRef}>
                    <RoutineTableGrid
                        selectedCourses={courses}
                        showRemoveButtons={showRemoveButtons}
                        onRemoveCourse={onRemoveCourse}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Hidden desktop table for PNG export — wrapper is invisible, inner ref is clean */}
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
        </>
    );

    if (!isModal) {
        // Inline mode: always desktop style, no modal wrapper
        return DesktopContent;
    }

    // Don't render modal until mounted (prevents desktop flash on mobile)
    if (!mounted) return null;

    if (isMobile) {
        return MobileContent;
    }

    // Desktop modal
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            {DesktopContent}
        </div>
    );
};

export default RoutineView;
