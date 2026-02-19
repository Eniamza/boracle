'use client';
import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Download } from 'lucide-react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { useIsMobile } from '@/hooks/use-mobile';

const RoutineView = ({
    title = "Routine",
    courses = [],
    onClose,
    onSave,
    isSaving = false,
    onRemoveCourse,
    showRemoveButtons = false,
    headerExtras,
    isModal = true,
    isOpen = true, // When false, animate out then call onClose
    isOwner = false,
    mobileAction,
    routineRefProp, // Allow parent to access ref
}) => {
    const internalRoutineRef = useRef(null);
    // Use prop ref if available, otherwise internal
    const routineRef = routineRefProp || internalRoutineRef;
    const isMobile = useIsMobile();
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const scrollYRef = useRef(0);

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

    // Wait one frame before rendering modal content so useIsMobile resolves
    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    // Handle isOpen changes — animate in/out
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            if (isModal && isMobile && mounted) {
                lockScroll();
                requestAnimationFrame(() => setIsVisible(true));
            }
        } else if (shouldRender) {
            // Animate out
            setIsVisible(false);
            if (isMobile && isModal) {
                const timer = setTimeout(() => {
                    setShouldRender(false);
                    unlockScroll();
                    onClose?.();
                }, 250);
                return () => clearTimeout(timer);
            } else {
                setShouldRender(false);
                onClose?.();
            }
        }
    }, [isOpen, isModal, isMobile, mounted]);

    const handleClose = () => {
        if (isMobile && isModal) {
            setIsVisible(false);
            setTimeout(() => {
                setShouldRender(false);
                unlockScroll();
                onClose?.();
            }, 250);
        } else {
            onClose?.();
        }
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
                    mobileAction={mobileAction}
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

        </>
    );

    if (!isModal) {
        return DesktopContent;
    }

    // Don't render modal until mounted (prevents desktop flash on mobile)
    if (!mounted || !shouldRender) return null;

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
