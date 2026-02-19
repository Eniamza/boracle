import React, { useRef } from 'react';
import { X, Save, Download } from 'lucide-react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';

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

    const handleExport = async () => {
        if (!courses || courses.length === 0 || !routineRef.current) return;

        await exportRoutineToPNG({
            routineRef,
            filename: title.toLowerCase().replace(/\s+/g, '-'),
            showToast: true,
        });
    };

    const Content = (
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
                            onClick={onClose}
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

    if (isModal) {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                {Content}
            </div>
        );
    }

    return Content;
};

export default RoutineView;
