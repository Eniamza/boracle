'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Trash2, Eye, Download, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { toast } from 'sonner';
import * as htmlToImage from 'html-to-image';

const SavedRoutinesPage = () => {
  const { data: session } = useSession();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed local toast state, use sonner toast only
  const [viewingRoutine, setViewingRoutine] = useState(null);
  const [routineCourses, setRoutineCourses] = useState([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);

  // Use sonner toast for notifications

  // Fetch saved routines
  const fetchRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/routine', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routines');
      }

      const data = await response.json();
      
      if (data.success) {
        setRoutines(data.routines || []);
        console.log('Fetched routines:', data.routines);
      } else {
        throw new Error('Failed to fetch routines');
      }
    } catch (err) {
      console.error('Error fetching routines:', err);
      setError('Failed to load saved routines');
  toast.error('Failed to load saved routines');
    } finally {
      setLoading(false);
    }
  };

  // Delete routine
  const deleteRoutine = async (routineId) => {
    try {
      const response = await fetch(`/api/routine/${routineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRoutines(prev => prev.filter(routine => routine.id !== routineId));
    toast.success('Routine deleted successfully');
      } else {
        throw new Error('Failed to delete routine');
      }
    } catch (err) {
      console.error('Error deleting routine:', err);
  toast.error('Failed to delete routine');
    }
  };

  // Parse routine string to get course info
  const parseRoutineString = (routineStr) => {
    try {
      const sectionIds = JSON.parse(atob(routineStr));
      return sectionIds.length;
    } catch (err) {
      return 0;
    }
  };

  // View routine details - fetch course data and show in modal
  const viewRoutine = async (routine) => {
    try {
      setLoadingRoutine(true);
      setViewingRoutine(routine);
      
      // Decode the routine string to get section IDs
      const sectionIds = JSON.parse(atob(routine.routineStr));
      
      // Fetch course data from the API
      const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
      const allCourses = await response.json();
      
      // Filter courses that match the section IDs in the routine
      const matchedCourses = allCourses.filter(course => 
        sectionIds.includes(course.sectionId)
      );
      
      setRoutineCourses(matchedCourses);
      
      if (matchedCourses.length === 0) {
        toast.error('No matching courses found for this routine');
      }
    } catch (err) {
      console.error('Error viewing routine:', err);
  toast.error('Failed to load routine details');
      setViewingRoutine(null);
    } finally {
      setLoadingRoutine(false);
    }
  };

  // Simple Modal wrapper for routine display
  const RoutineTableModal = ({ selectedCourses, onClose }) => {
    const routineRef = useRef(null);

    const exportToPNG = async () => {
      if (!selectedCourses || selectedCourses.length === 0) {
        toast.error('No courses to export');
        return;
      }

      if (!routineRef?.current) {
        toast.error('Routine table not found');
        return;
      }

      try {
        const dataUrl = await htmlToImage.toPng(routineRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#111827',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          }
        });
        
        const link = document.createElement('a');
        link.download = `routine-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
        
        toast.success('Routine exported successfully!');
      } catch (error) {
        console.error('Error exporting to PNG:', error);
        toast.error('Failed to export routine as PNG. Please try again.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Saved Routine</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPNG}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save as PNG
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" ref={routineRef}>
            <RoutineTableGrid 
              selectedCourses={selectedCourses} 
              showRemoveButtons={false}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  };

  // Helper to close modal
  const closeRoutineModal = () => {
    setViewingRoutine(null);
    setRoutineCourses([]);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  return (
    <div className="min-h-screen  text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Saved Routines</h1>
      {/* sonner toast handles notifications globally */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
          <p className="text-gray-400">Loading saved routines...</p>
        </div>
      ) : routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <AlertCircle className="w-8 h-8 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            You haven't saved any routines yet. Create a routine in the Pre-Registration page to get started.
          </p>
          <a
            href="/dashboard/preprereg"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Build New Routine
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine, index) => (
            <div
              key={routine.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              {/* Routine Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg">Routine #{routine.id}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">
                        Last updated: {routine.createdAt ? new Date(Number(routine.createdAt) * 1000).toLocaleString() : 'N/A'}
                      </p>
                      {routine.semester && (
                        <span className="inline-block bg-blue-800/80 text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded ml-1 align-middle">
                          {routine.semester}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {parseRoutineString(routine.routineStr)} courses
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => viewRoutine(routine)}
                  disabled={loadingRoutine}
                  className="flex-1 px-3 py-2 bg-white text-gray-900 hover:bg-gray-300 disabled:bg-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {loadingRoutine && viewingRoutine?.id === routine.id ? 'Loading...' : 'View'}
                </button>
                <button
                  title="Copy Routine ID"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(routine.id.toString());
                      toast.success('Routine ID copied!');
                    } catch (err) {
                      toast.error('Failed to copy ID');
                    }
                  }}
                  className="px-3 py-2 hover:bg-gray-800 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                  style={{ lineHeight: 0 }}
                >
                  {/* Lucide Copy icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="3" y="3" width="13" height="13" rx="2" /></svg>
                </button>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="px-3 py-2 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {routines.length > 0 && (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{routines.length}</div>
              <div className="text-sm text-gray-400">Total Routines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {routines.reduce((sum, routine) => sum + parseRoutineString(routine.routineStr), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {routines.length > 0 ? Math.round(routines.reduce((sum, routine) => sum + parseRoutineString(routine.routineStr), 0) / routines.length) : 0}
              </div>
              <div className="text-sm text-gray-400">Avg. Courses per Routine</div>
            </div>
          </div>
        </div>
      )}

      {/* Routine View Modal */}
      {viewingRoutine && (
        <RoutineTableModal 
          selectedCourses={routineCourses} 
          onClose={closeRoutineModal}
        />
      )}
    </div>
  );
};
export default SavedRoutinesPage;
