'use client';
import React, { useEffect, useState, useRef } from 'react';
import { X, Check, Calendar } from 'lucide-react';

/**
 * Mobile bottom-sheet for selecting a saved routine.
 * Mirrors CourseBottomSheet transitions exactly.
 */
const RoutineSelectorSheet = ({ isOpen, onClose, routines = [], selectedRoutineId, onSelect }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const isLockedByMe = useRef(false);

    const lockScroll = () => {
        if (!isLockedByMe.current) {
            const count = parseInt(document.body.dataset.scrollLockCount || '0', 10);
            if (count === 0) {
                const scrollY = window.scrollY;
                document.body.dataset.lockScrollY = scrollY.toString();
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.width = '100%';
            }
            document.body.dataset.scrollLockCount = (count + 1).toString();
            isLockedByMe.current = true;
        }
    };

    const unlockScroll = () => {
        if (isLockedByMe.current) {
            const count = parseInt(document.body.dataset.scrollLockCount || '0', 10);
            if (count <= 1) {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                const scrollY = parseInt(document.body.dataset.lockScrollY || '0', 10);
                window.scrollTo(0, scrollY);
                document.body.dataset.scrollLockCount = '0';
            } else {
                document.body.dataset.scrollLockCount = (count - 1).toString();
            }
            isLockedByMe.current = false;
        }
    };

    useEffect(() => {
        return () => {
            if (isLockedByMe.current) unlockScroll();
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            lockScroll();
            const timer = setTimeout(() => setIsVisible(true), 20);
            return () => clearTimeout(timer);
        } else if (shouldRender) {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
                unlockScroll();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        onClose?.();
    };

    const handleSelect = (routineId) => {
        onSelect?.(routineId);
        handleClose();
    };

    if (!shouldRender) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl transform transition-transform duration-200 ease-out max-h-[70vh] overflow-y-auto ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Content */}
                <div className="px-5 pb-6 pt-2 space-y-3">
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100 pr-8">
                        Select Saved Routine
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose one of your saved routines to auto-fill the Routine ID
                    </p>

                    <div className="space-y-2 mt-2">
                        {routines.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No saved routines found</p>
                            </div>
                        ) : (
                            routines.map((routine) => {
                                const isSelected = selectedRoutineId === routine.id;
                                return (
                                    <button
                                        key={routine.id}
                                        onClick={() => handleSelect(routine.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`text-sm font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {routine.routineName || `Routine #${routine.routineNumber}`}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {new Date(Number(routine.createdAt) * 1000).toLocaleString(undefined, {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default RoutineSelectorSheet;
