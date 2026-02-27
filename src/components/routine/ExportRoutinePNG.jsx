// ExportRoutinePNG.jsx
'use client';
import React, { useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';

// ! Default export settings - can be customized per use case
const DEFAULT_EXPORT_OPTIONS = {
  width: 1800,           // ? Desktop width for consistent exports
  pixelRatio: 3,         // ? Higher = better quality, larger file
  quality: 0.95,
  zoom: 0.5,
  waitTime: 100,         // ? Wait for styles to apply
};

// ! Helper to detect current theme and return appropriate background color
const getThemeAwareBackgroundColor = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  return isDarkMode ? '#111827' : '#f9fafb'; // gray-900 vs gray-50
};

// ! Core export function - handles all the PNG export logic
// ? Takes a ref to a routine element, clones it into a hidden container,
// ? renders it at a fixed desktop width for consistency, then triggers download.
// ? Options: routineRef, filename, showToast, width, pixelRatio, backgroundColor, onSuccess, onError
export const exportRoutineToPNG = async ({
  routineRef,
  filename = 'routine',
  showToast = true,
  width = DEFAULT_EXPORT_OPTIONS.width,
  pixelRatio = DEFAULT_EXPORT_OPTIONS.pixelRatio,
  quality = DEFAULT_EXPORT_OPTIONS.quality,
  backgroundColor, // ? If not provided, will auto-detect based on current theme
  zoom = DEFAULT_EXPORT_OPTIONS.zoom,
  waitTime = DEFAULT_EXPORT_OPTIONS.waitTime,
  onSuccess,
  onError,
}) => {
  if (!routineRef?.current) {
    if (showToast) toast.error('Routine table not found');
    onError?.('Routine table not found');
    return false;
  }

  // ? Auto-detect theme if backgroundColor not explicitly provided
  const resolvedBackgroundColor = backgroundColor ?? getThemeAwareBackgroundColor();
  const isDarkMode = document.documentElement.classList.contains('dark');

  const originalRoutineSegment = routineRef.current;

  // ? Hidden container for the cloned routine segment
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = `${width}px`;
  // ! Use transform instead of zoom - iOS Safari handles zoom inconsistently
  // ! which can clip the rightmost columns (e.g., Saturday)
  container.style.transform = `scale(${zoom})`;
  container.style.transformOrigin = 'top left';

  // ! Apply theme class to container so dark: variants work correctly
  if (isDarkMode) {
    container.classList.add('dark');
  }

  document.body.appendChild(container);

  // ? Cloning the Routine Segment
  const clonedRoutine = originalRoutineSegment.cloneNode(true);

  // ? Remove export-hide elements (like cross buttons) from the cloned routine
  const exportHideElements = clonedRoutine.querySelectorAll('.export-hide');
  exportHideElements.forEach(el => el.remove());

  // ? Force the clonedRoutine to show everything and adjust to desktop resolution
  clonedRoutine.style.width = `${width}px`;
  clonedRoutine.style.minWidth = `${width}px`;
  clonedRoutine.style.height = 'auto';
  clonedRoutine.style.overflow = 'visible';
  container.appendChild(clonedRoutine);

  try {
    // ? We are waiting here, because our browser can be stupidly dumb (And also slow ¯\_(ツ)_/¯)
    // ? which causes html-to-image to capture the image before styles are even applied, resulting in a broken image
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // ! Use scrollWidth to ensure we capture the full width including all columns
    const captureWidth = Math.max(width, clonedRoutine.scrollWidth);

    const dataUrl = await htmlToImage.toPng(clonedRoutine, {
      quality,
      pixelRatio, // ! Higher number -> Higher resolution -> Larger file size
      backgroundColor: resolvedBackgroundColor,
      width: captureWidth,
      height: clonedRoutine.scrollHeight,
    });

    // ? Annihilation of the cloned routine
    document.body.removeChild(container);

    // ? Trigger download
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();

    if (showToast) toast.success('Routine exported successfully!');
    onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error exporting routine:', error);

    // ? Cleanup on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }

    if (showToast) toast.error('Failed to export routine.');
    onError?.(error);
    return false;
  }
};

// ! React Hook for exporting routine as PNG with validation and loading state
// ? Wraps exportRoutineToPNG with course validation and isExporting state management.
// ? Use this when you need to track export progress or validate courses before export.
// ? Returns: { exportToPNG, isExporting }
export const useExportRoutinePNG = ({
  routineRef,
  courses = [],
  filename = 'routine',
  showValidationErrors = true,
  ...exportOptions
} = {}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToPNG = useCallback(async () => {
    // ? Validation - ensure we have courses to export
    if (!courses || courses.length === 0) {
      if (showValidationErrors) toast.error('No courses to export');
      return false;
    }

    if (!routineRef?.current) {
      if (showValidationErrors) toast.error('Routine table not found');
      return false;
    }

    setIsExporting(true);

    try {
      const result = await exportRoutineToPNG({
        routineRef,
        filename,
        ...exportOptions,
      });
      return result;
    } finally {
      setIsExporting(false);
    }
  }, [routineRef, courses, filename, showValidationErrors, exportOptions]);

  return { exportToPNG, isExporting };
};

// ? Download Icon SVG Component
const DownloadIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

// ! The same Export PNG Button Component which has been used a thousands of times :v
// ? Drop-in button that handles validation, loading state, and export.
// ? Props: routineRef, courses, filename, label, className, showIcon, disabled
const ExportRoutinePNG = ({
  routineRef,
  courses = [],
  filename = 'routine',
  label = 'Save as PNG',
  className = '',
  showIcon = true,
  disabled = false,
  ...exportOptions
}) => {
  const { exportToPNG, isExporting } = useExportRoutinePNG({
    routineRef,
    courses,
    filename,
    ...exportOptions,
  });

  return (
    <button
      onClick={exportToPNG}
      disabled={disabled || isExporting}
      className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors text-white ${className}`}
    >
      {showIcon && <DownloadIcon />}
      {isExporting ? 'Exporting...' : label}
    </button>
  );
};

export default ExportRoutinePNG;