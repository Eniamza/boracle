// ExportRoutinePNG.jsx
'use client';
import React from 'react';
import * as htmlToImage from 'html-to-image';
// Install with: npm install html-to-image
import { toast } from 'sonner';

const ExportRoutinePNG = ({ selectedCourses, routineRef, displayToast }) => {
  const exportToPNG = async () => {
    if (!selectedCourses || selectedCourses.length === 0) {
      toast.error('Please select some courses first');
      return;
    }

    if (!routineRef?.current) {
      toast.error('Routine table not found');
      return;
    }

    try {
      // ? Detect current theme mode by checking if 'dark' class exists on html element
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // ! Use appropriate background color based on current theme
      const backgroundColor = isDarkMode ? '#111827' : '#f9fafb'; // gray-900 vs gray-50

      // Using html-to-image to capture the actual visible routine table
      const dataUrl = await htmlToImage.toPng(routineRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: backgroundColor,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        // ? Filter function to ensure theme classes are preserved on cloned elements
        filter: (node) => {
          // Include all nodes
          return true;
        },
        // ! Apply computed styles to handle dark: variant classes properly
        onclone: (clonedDoc, element) => {
          // Force the same theme class on the cloned document
          if (isDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
          } else {
            clonedDoc.documentElement.classList.remove('dark');
          }
        }
      });
      
      // Download the image
      const link = document.createElement('a');
      link.download = `routine-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      if (displayToast) {
        displayToast('Routine exported successfully!', 'success');
      }
      
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      toast.error('Failed to export routine as PNG. Please try again.');
    }
  };
  
  return (
    <button
      onClick={exportToPNG}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Save as PNG
    </button>
  );
};

export default ExportRoutinePNG;