'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Trash2, Eye, Download, RefreshCw, AlertCircle, X, Users, Share2, Copy, Check, Link, Plus, Cable, Hammer } from 'lucide-react';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as htmlToImage from 'html-to-image';

const SavedRoutinesPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [routines, setRoutines] = useState([]);
  const [mergedRoutines, setMergedRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMerged, setLoadingMerged] = useState(true);
  const [error, setError] = useState(null);
  // Removed local toast state, use sonner toast only
  const [viewingRoutine, setViewingRoutine] = useState(null);
  const [viewingMergedRoutine, setViewingMergedRoutine] = useState(null);
  const [routineCourses, setRoutineCourses] = useState([]);
  const [mergedRoutineCourses, setMergedRoutineCourses] = useState([]);
  const [mergedRoutineFriends, setMergedRoutineFriends] = useState([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [copiedRoutineId, setCopiedRoutineId] = useState(null);
  const [copiedMergedRoutineId, setCopiedMergedRoutineId] = useState(null);

  // Floating button states
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [routineIdInput, setRoutineIdInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [sharingRoutineId, setSharingRoutineId] = useState(null);
  const [sharingRoutineType, setSharingRoutineType] = useState('routine');
  const [facultyMap, setFacultyMap] = useState({});

  // Predefined color palette for friends
  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#E879F9', // Fuchsia
    '#A855F7', // Violet
    '#F43F5E', // Rose
    '#8B5CF6', // Indigo
    '#0EA5E9', // Sky
  ];


  // Fetch faculty data for tooltip enrichment
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/faculty/lookup')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFacultyMap(data.facultyMap);

            // Re-enrich currently viewed routine courses if any
            setRoutineCourses(prev => prev.map(course => {
              const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
              const facultyInfo = data.facultyMap[firstInitial];
              return {
                ...course,
                employeeName: facultyInfo?.facultyName || null,
                employeeEmail: facultyInfo?.email || null,
              };
            }));

            // Re-enrich currently viewed merged routine courses if any
            setMergedRoutineCourses(prev => prev.map(course => {
              const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
              const facultyInfo = data.facultyMap[firstInitial];
              return {
                ...course,
                employeeName: facultyInfo?.facultyName || null,
                employeeEmail: facultyInfo?.email || null,
              };
            }));
          }
        })
        .catch(err => console.error('Error fetching faculty data:', err));
    }
  }, [session]);

  // Close floating options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFloatingOptions
        && !event.target.closest('.floating-action-container')
        && !event.target.closest('.floating-action-sheet')) {
        setShowFloatingOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFloatingOptions]);

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
        // Sort routines by createdAt (newest first) for display, but keep original order info for numbering
        const routinesWithIndex = (data.routines || [])
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)) // oldest first for numbering
          .map((routine, idx) => ({ ...routine, routineNumber: idx + 1 })) // assign number based on creation order
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); // newest first for display
        setRoutines(routinesWithIndex);
        console.log('Fetched routines:', routinesWithIndex);
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

  // Fetch merged routines
  const fetchMergedRoutines = async () => {
    try {
      setLoadingMerged(true);

      const response = await fetch('/api/merged-routine', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merged routines');
      }

      const data = await response.json();

      if (data.success) {
        // Sort merged routines by createdAt (newest first) for display, but keep original order info for numbering
        const routinesWithIndex = (data.routines || [])
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)) // oldest first for numbering
          .map((routine, idx) => ({ ...routine, routineNumber: idx + 1 })) // assign number based on creation order
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); // newest first for display
        setMergedRoutines(routinesWithIndex);
        console.log('Fetched merged routines:', routinesWithIndex);
      } else {
        throw new Error('Failed to fetch merged routines');
      }
    } catch (err) {
      console.error('Error fetching merged routines:', err);
    } finally {
      setLoadingMerged(false);
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

  // Delete merged routine
  const deleteMergedRoutine = async (routineId) => {
    try {
      const response = await fetch(`/api/merged-routine/${routineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMergedRoutines(prev => prev.filter(routine => routine.id !== routineId));
        toast.success('Merged routine deleted successfully');
      } else {
        throw new Error('Failed to delete merged routine');
      }
    } catch (err) {
      console.error('Error deleting merged routine:', err);
      toast.error('Failed to delete merged routine');
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

  // Parse merged routine data to get friend names and total courses
  const parseMergedRoutineData = (routineData) => {
    try {
      const data = JSON.parse(routineData);
      const friendNames = data.map(item => item.friendName).filter(Boolean);
      const totalCourses = data.reduce((sum, item) => sum + (item.sectionIds?.length || 0), 0);
      return { friendNames, totalCourses };
    } catch (err) {
      return { friendNames: [], totalCourses: 0 };
    }
  };

  // ! Import routine by ID [Saved + Merged]
  const importRoutineById = async () => {
    if (!routineIdInput.trim()) {
      toast.error('Please enter a routine ID');
      return;
    }

    try {
      setImporting(true);
      const routineId = routineIdInput.trim();

      // ! Hunt routine in saved routines first
      const savedResponse = await fetch(`/api/routine/${routineId}`);
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        if (savedData.success && savedData.routine) {
          // ? Import as a new saved routine - POST request to routine endpoint
          const importResponse = await fetch('/api/routine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              routineStr: savedData.routine.routineStr,
              email: session.user.email
            })
          });

          if (importResponse.ok) {
            toast.success('Routine imported successfully!');
            fetchRoutines(); // Refreshing the list, to show the newly imported routine :D :D :D
            setShowImportModal(false);
            setRoutineIdInput('');
            return;
          }
        }
      }

      // ! Next, Checking in the merged routines table if not found in saved routines
      const mergedResponse = await fetch(`/api/merged-routine/${routineId}`);
      if (mergedResponse.ok) {
        const mergedData = await mergedResponse.json();
        if (mergedData.success && mergedData.routine) {
          // ? Import as a new merged routine - POST request to merged routine endpoint
          const importResponse = await fetch('/api/merged-routine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              routineData: mergedData.routine.routineData
            })
          });

          if (importResponse.ok) {
            toast.success('Merged routine imported successfully!');
            fetchMergedRoutines(); // Refresh the list
            setShowImportModal(false);
            setRoutineIdInput('');
            return;
          }
        }
      }

      // If routine not found in either table
      toast.error('Routine not found. Please check the routine ID.');

    } catch (error) {
      console.error('Error importing routine:', error);
      toast.error('Failed to import routine');
    } finally {
      setImporting(false);
    }
  };

  // ? Handle floating button actions
  const handleBuildRoutine = () => {
    router.push('/dashboard/preprereg');
    setShowFloatingOptions(false);
  };

  const handleMergeRoutines = () => {
    router.push('/dashboard/merge-routines');
    setShowFloatingOptions(false);
  };

  const handleImportRoutine = () => {
    setShowImportModal(true);
    setShowFloatingOptions(false);
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

      setRoutineCourses(matchedCourses.map(course => {
        const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
        const facultyInfo = facultyMap[firstInitial];
        return {
          ...course,
          employeeName: facultyInfo?.facultyName || null,
          employeeEmail: facultyInfo?.email || null,
        };
      }));

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

  // View merged routine details - fetch course data and show in modal
  const viewMergedRoutine = async (routine) => {
    try {
      setLoadingRoutine(true);
      setViewingMergedRoutine(routine);

      // Parse the routine data to get all section IDs with friend info
      const data = JSON.parse(routine.routineData);

      // Create friends array with colors
      const friends = data.map((item, index) => ({
        id: index,
        friendName: item.friendName,
        color: colorPalette[index % colorPalette.length],
        sectionIds: item.sectionIds || []
      }));

      setMergedRoutineFriends(friends);

      const allSectionIds = data.flatMap(item => item.sectionIds || []);

      // Fetch course data from the API
      const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
      const allCourses = await response.json();

      // Filter courses that match the section IDs and attach friend info
      const matchedCourses = allCourses
        .filter(course => allSectionIds.includes(course.sectionId))
        .map(course => {
          // Find which friend this course belongs to
          const friend = friends.find(f => f.sectionIds.includes(course.sectionId));
          // Enrich with faculty data if available
          const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
          const facultyInfo = facultyMap[firstInitial];
          return {
            ...course,
            friendName: friend?.friendName || 'Unknown',
            friendColor: friend?.color || '#6B7280',
            employeeName: facultyInfo?.facultyName || null,
            employeeEmail: facultyInfo?.email || null,
          };
        });

      setMergedRoutineCourses(matchedCourses);

      if (matchedCourses.length === 0) {
        toast.error('No matching courses found for this merged routine');
      }
    } catch (err) {
      console.error('Error viewing merged routine:', err);
      toast.error('Failed to load merged routine details');
      setViewingMergedRoutine(null);
    } finally {
      setLoadingRoutine(false);
    }
  };

  // Share Modal Component
  const ShareModal = ({ routineId, type = 'routine', onClose }) => {
    const [linkCopied, setLinkCopied] = useState(false);
    const shareUrl = `${window.location.origin}/${type}/${routineId}`;
    const shareText = `Check out my routine on BRACU O.R.A.C.L.E!`;

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    };

    const shareToMessenger = () => {
      window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareToWhatsApp = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    };

    const shareToDiscord = () => {
      // Discord doesn't have a direct share URL, so copy a formatted message
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Copied! Paste it in your Discord chat.');
    };

    return (
      <>
        {/* Blurred backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
        {/* Centered modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Routine</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Copiable Link */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Shareable Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 min-w-0">
                  <Link className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">{shareUrl}</span>
                </div>
                <button
                  onClick={copyLink}
                  className={`flex-shrink-0 px-3 py-2.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${linkCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Social Media Icons */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block">Share via</label>
              <div className="flex items-center justify-center gap-4">
                {/* Messenger */}
                <button
                  onClick={shareToMessenger}
                  className="group flex flex-col items-center gap-1.5"
                  title="Share on Messenger"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.15.14.25.36.22.58l-.04 1.78c-.02.58.56.98 1.08.74l1.98-.87c.17-.07.36-.09.54-.05.92.25 1.9.39 2.93.39h.14c5.64 0 10.02-4.13 10.02-9.7C22 6.13 17.64 2 12 2zm5.85 7.65l-2.85 4.53c-.46.73-1.44.9-2.1.37l-2.27-1.7a.6.6 0 00-.72 0l-3.06 2.32c-.41.31-.94-.2-.67-.65l2.85-4.53c.46-.73 1.44-.9 2.1-.37l2.27 1.7a.6.6 0 00.72 0l3.06-2.32c.41-.31.94.2.67.65z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Messenger</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={shareToWhatsApp}
                  className="group flex flex-col items-center gap-1.5"
                  title="Share on WhatsApp"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">WhatsApp</span>
                </button>

                {/* Discord */}
                <button
                  onClick={shareToDiscord}
                  className="group flex flex-col items-center gap-1.5"
                  title="Share on Discord"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8732.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Discord</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
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
        const originalRoutineSegment = routineRef.current;
        if (!originalRoutineSegment) return;

        // ? Detect current theme mode by checking if 'dark' class exists on html element
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        // ! Use appropriate background color based on current theme
        const backgroundColor = isDarkMode ? '#111827' : '#f9fafb'; // gray-900 vs gray-50

        const scrolledWidth = 1800; // ! FORCE a standard desktop width- Change to increase downloaded image's width

        // ? Hidden container for the cloned routine segment
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = scrolledWidth + 'px';

        // ! Apply theme class to container so dark: variants work correctly
        if (isDarkMode) {
          container.classList.add('dark');
        }

        container.style.zoom = 0.5;

        document.body.appendChild(container);

        // ? Cloning the Routine Segment
        const clonedRoutine = originalRoutineSegment.cloneNode(true);

        // ? Force the clonedRoutine to show everything and adjust to desktop resolution
        clonedRoutine.style.width = scrolledWidth + 'px';
        clonedRoutine.style.height = 'auto';
        clonedRoutine.style.overflow = 'visible';

        container.appendChild(clonedRoutine);

        // ? We are waiting here, because our browser can be stuipidly dumb (And also slow ¯\_(ツ)_/¯)
        // ? which causes html-to-image to capture the image before styles are even applied, resulting in a broken image
        await new Promise(resolve => setTimeout(resolve, 100));

        const dataUrl = await htmlToImage.toPng(clonedRoutine, {
          quality: 0.95,
          pixelRatio: 3, // ! Higher number -> Higher resolution -> Larger file size (Maybe add a slider on client side for them to adjust this in the future?)
          backgroundColor: backgroundColor,
          width: scrolledWidth,
          height: clonedRoutine.scrollHeight,
        });

        // ? Anhilation of the cloned routine and resetting styles back to normal
        document.body.removeChild(container);

        const link = document.createElement('a');
        link.download = `merged-routine-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();

        toast.success('Routine exported successfully!');
      } catch (error) {
        console.error('Error exporting routine:', error);
        toast.error('Failed to export routine.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Saved Routine</h2>
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
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

  // Merged Routine Table Modal with color-coded cells
  const MergedRoutineTableModal = ({ courses, friends, onClose }) => {
    const routineRef = useRef(null);
    const [hoveredCourse, setHoveredCourse] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const timeSlots = [
      '08:00 AM-09:20 AM',
      '09:30 AM-10:50 AM',
      '11:00 AM-12:20 PM',
      '12:30 PM-01:50 PM',
      '02:00 PM-03:20 PM',
      '03:30 PM-04:50 PM',
      '05:00 PM-06:20 PM'
    ];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Time conversion utilities
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

    // Get courses for a specific slot
    const getCoursesForSlot = (day, timeSlot) => {
      const [slotStart, slotEnd] = timeSlot.split('-');
      const slotStartMin = timeToMinutes(slotStart);
      const slotEndMin = timeToMinutes(slotEnd);

      return courses.filter(course => {
        // Check class schedules
        const classMatch = course.sectionSchedule?.classSchedules?.some(schedule => {
          if (schedule.day !== day.toUpperCase()) return false;
          const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
          const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
          return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
        });

        // Check lab schedules
        const labMatch = course.labSchedules?.some(schedule => {
          if (schedule.day !== day.toUpperCase()) return false;
          const scheduleStart = timeToMinutes(formatTime(schedule.startTime));
          const scheduleEnd = timeToMinutes(formatTime(schedule.endTime));
          return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
        });

        return classMatch || labMatch;
      });
    };

    const exportToPNG = async () => {
      if (!courses || courses.length === 0) {
        toast.error('No courses to export');
        return;
      }

      if (!routineRef?.current) {
        toast.error('Routine table not found');
        return;
      }

      try {
        const originalRoutineSegment = routineRef.current;
        if (!originalRoutineSegment) return;

        // ? Detect current theme mode by checking if 'dark' class exists on html element
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        // ! Use appropriate background color based on current theme
        const backgroundColor = isDarkMode ? '#111827' : '#f9fafb'; // gray-900 vs gray-50

        const scrolledWidth = 1800; // ! FORCE a standard desktop width- Change to increase downloaded image's width

        // ? Hidden container for the cloned routine segment
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = scrolledWidth + 'px';

        // ! Apply theme class to container so dark: variants work correctly
        if (isDarkMode) {
          container.classList.add('dark');
        }

        container.style.zoom = 0.5;

        document.body.appendChild(container);

        // ? Cloning the Routine Segment
        const clonedRoutine = originalRoutineSegment.cloneNode(true);

        // ? Force the clonedRoutine to show everything and adjust to desktop resolution
        clonedRoutine.style.width = scrolledWidth + 'px';
        clonedRoutine.style.height = 'auto';
        clonedRoutine.style.overflow = 'visible';

        container.appendChild(clonedRoutine);

        // ? We are waiting here, because our browser can be stuipidly dumb (And also slow ¯\_(ツ)_/¯)
        // ? which causes html-to-image to capture the image before styles are even applied, resulting in a broken image
        await new Promise(resolve => setTimeout(resolve, 100));

        const dataUrl = await htmlToImage.toPng(clonedRoutine, {
          quality: 0.95,
          pixelRatio: 3, // ! Higher number -> Higher resolution -> Larger file size (Maybe add a slider on client side for them to adjust this in the future?)
          backgroundColor: backgroundColor,
          width: scrolledWidth,
          height: clonedRoutine.scrollHeight,
        });

        // ? Anhilation of the cloned routine and resetting styles back to normal
        document.body.removeChild(container);

        const link = document.createElement('a');
        link.download = `merged-routine-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();

        toast.success('Routine exported successfully!');
      } catch (error) {
        console.error('Error exporting routine:', error);
        toast.error('Failed to export routine.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[95vw] max-h-[95vh] w-full overflow-hidden flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Merged Routine</h2>
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" ref={routineRef}>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
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
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-36 border-r border-gray-200 dark:border-gray-700">Time/Day</th>
                      {days.map(day => (
                        <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot} className="border-b border-gray-200 dark:border-gray-800">
                        <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                          {timeSlot}
                        </td>
                        {days.map(day => {
                          const slotCourses = getCoursesForSlot(day, timeSlot);

                          return (
                            <td key={`${day}-${timeSlot}`} className="p-2 border-l border-gray-200 dark:border-gray-800 relative">
                              {slotCourses.length > 0 && (
                                <div className="space-y-1">
                                  {slotCourses.map((course, idx) => {
                                    // Check if this specific time slot is for a lab
                                    const isLab = course.labSchedules?.some(s => {
                                      if (s.day !== day.toUpperCase()) return false;
                                      const scheduleStart = timeToMinutes(formatTime(s.startTime));
                                      const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                                      const slotStartMin = timeToMinutes(timeSlot.split('-')[0]);
                                      const slotEndMin = timeToMinutes(timeSlot.split('-')[1]);
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
                                        <div className="font-semibold text-gray-900 dark:text-white">
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tooltip */}
              <CourseHoverTooltip
                course={hoveredCourse}
                position={tooltipPosition}
                extraFields={hoveredCourse ? [{ label: 'Friend', value: hoveredCourse.friendName }] : []}
              />
            </div>
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

  // Helper to close merged routine modal
  const closeMergedRoutineModal = () => {
    setViewingMergedRoutine(null);
    setMergedRoutineCourses([]);
    setMergedRoutineFriends([]);
  };

  useEffect(() => {
    fetchRoutines();
    fetchMergedRoutines();
  }, []);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Saved Routines</h1>
      {/* sonner toast handles notifications globally */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading saved routines...</p>
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
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm"
            >
              {/* Routine Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    {/* User's First name with routine number */}
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {session?.user?.name
                        ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Routine #${routine.routineNumber}`
                        : `Routine #${routine.routineNumber}`}
                    </h3>
                    {/* Routine ID as copyable code subtitle */}
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(routine.id.toString());
                          setCopiedRoutineId(routine.id);
                          setTimeout(() => setCopiedRoutineId(null), 3000);
                        } catch (err) {
                          toast.error('Failed to copy ID');
                        }
                      }}
                      className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copiedRoutineId === routine.id
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                      <code className={`px-2 py-0.5 rounded font-mono ${copiedRoutineId === routine.id
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>{routine.id}</code>
                      <span className="flex items-center gap-1">
                        {copiedRoutineId === routine.id ? 'Copied' : 'Copy'}
                        {copiedRoutineId === routine.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <rect x="3" y="3" width="13" height="13" rx="2" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-500">
                        {routine.createdAt ? new Date(Number(routine.createdAt) * 1000).toLocaleString() : 'N/A'}
                      </p>
                      {routine.semester && (
                        <span className="inline-block bg-blue-100 dark:bg-blue-800/80 text-blue-700 dark:text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {routine.semester}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {loadingRoutine && viewingRoutine?.id === routine.id ? 'Loading...' : 'View'}
                </button>
                <button
                  onClick={() => { setSharingRoutineId(routine.id); setSharingRoutineType('routine'); }}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors text-gray-600 dark:text-gray-300"
                  title="Share routine"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="px-3 py-2 hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged Routines Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2 text-gray-900 dark:text-white">
          <Users className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          Merged Routines
        </h2>

        {loadingMerged ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading merged routines...</p>
          </div>
        ) : mergedRoutines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Users className="w-8 h-8 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              You haven't saved any merged routines yet. Create a merged routine in the Merge Routines page.
            </p>
            <a
              href="/dashboard/merge-routines"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Merge Routines
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mergedRoutines.map((routine, index) => {
              const { friendNames, totalCourses } = parseMergedRoutineData(routine.routineData);
              return (
                <div
                  key={routine.id}
                  className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800/50 rounded-lg p-6 hover:border-purple-300 dark:hover:border-purple-600/50 transition-colors shadow-sm"
                >
                  {/* Routine Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        {/* Merged Routine title with number */}
                        <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-100">
                          {session?.user?.name
                            ? `${session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1).toLowerCase()}'s Merged Routine #${routine.routineNumber}`
                            : `Merged Routine #${routine.routineNumber}`}
                        </h3>
                        {/* Routine ID as copyable code subtitle */}
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(routine.id.toString());
                              setCopiedMergedRoutineId(routine.id);
                              setTimeout(() => setCopiedMergedRoutineId(null), 3000);
                            } catch (err) {
                              toast.error('Failed to copy ID');
                            }
                          }}
                          className={`flex items-center gap-1.5 mt-1 text-xs transition-colors ${copiedMergedRoutineId === routine.id
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                        >
                          <code className={`px-2 py-0.5 rounded font-mono ${copiedMergedRoutineId === routine.id
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>{routine.id}</code>
                          <span className="flex items-center gap-1">
                            {copiedMergedRoutineId === routine.id ? 'Copied' : 'Copy'}
                            {copiedMergedRoutineId === routine.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <rect x="3" y="3" width="13" height="13" rx="2" />
                              </svg>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-gray-500">
                            {routine.createdAt ? new Date(Number(routine.createdAt) * 1000).toLocaleString() : 'N/A'}
                          </p>
                          {routine.semester && (
                            <span className="inline-block bg-purple-100 dark:bg-purple-800/80 text-purple-700 dark:text-purple-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {routine.semester}
                            </span>
                          )}
                        </div>
                        {/* Friend Names */}
                        {friendNames.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {friendNames.map((name, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 text-xs px-2 py-0.5 rounded"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {totalCourses} courses • {friendNames.length} {friendNames.length === 1 ? 'friend' : 'friends'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewMergedRoutine(routine)}
                      disabled={loadingRoutine}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {loadingRoutine && viewingMergedRoutine?.id === routine.id ? 'Loading...' : 'View'}
                    </button>
                    <button
                      onClick={() => { setSharingRoutineId(routine.id); setSharingRoutineType('merged-routine'); }}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors text-gray-600 dark:text-gray-300"
                      title="Share routine"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMergedRoutine(routine.id)}
                      className="px-3 py-2 hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routine View Modal */}
      {viewingRoutine && (
        <RoutineTableModal
          selectedCourses={routineCourses}
          onClose={closeRoutineModal}
        />
      )}

      {/* Merged Routine View Modal */}
      {viewingMergedRoutine && (
        <MergedRoutineTableModal
          courses={mergedRoutineCourses}
          friends={mergedRoutineFriends}
          onClose={closeMergedRoutineModal}
        />
      )}

      {/* Backdrop overlay when floating menu is open */}
      {showFloatingOptions && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setShowFloatingOptions(false)}
        />
      )}

      {/* Centered Action Sheet */}
      {showFloatingOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="floating-action-sheet pointer-events-auto flex flex-col gap-3 w-80 animate-in fade-in zoom-in-95 duration-200">
            {/* Build a Routine */}
            <button
              onClick={handleBuildRoutine}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-blue-500/50 hover:shadow-blue-500/10 hover:ring-2 hover:ring-blue-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-blue-500/15 group-hover:bg-blue-500/25 transition-colors">
                <Hammer className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Build a Routine</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Create your own from scratch</span>
              </div>
            </button>

            {/* Import a Routine */}
            <button
              onClick={handleImportRoutine}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-green-500/50 hover:shadow-green-500/10 hover:ring-2 hover:ring-green-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-green-500/15 group-hover:bg-green-500/25 transition-colors">
                <Download className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Import a Routine</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Via a shared Routine ID</span>
              </div>
            </button>

            {/* Merge Routines */}
            <button
              onClick={handleMergeRoutines}
              className="group flex items-center gap-4 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl hover:border-purple-500/50 hover:shadow-purple-500/10 hover:ring-2 hover:ring-purple-400/60 transition-all duration-200 hover:scale-[1.02] text-gray-900 dark:text-white"
            >
              <div className="p-3 rounded-xl bg-purple-500/15 group-hover:bg-purple-500/25 transition-colors">
                <Cable className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <span className="text-base font-semibold block leading-tight">Merge Routines</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Combine with friends</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 floating-action-container">
        <button
          onClick={() => setShowFloatingOptions(!showFloatingOptions)}
          className="group px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-3 text-white"
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${showFloatingOptions ? 'rotate-45' : 'rotate-0'}`} />
          <span className="text-sm font-semibold">Add Routine</span>
        </button>
      </div>

      {/* Import Routine Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md !bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700/60 !rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <Download className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-center text-lg">
              Import a Routine
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
              Enter the routine ID shared by your friend. We&apos;ll automatically detect the type and save a copy to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2 pb-1">
            <div className="space-y-2">
              <Label htmlFor="routine-id" className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Routine ID</Label>
              <Input
                id="routine-id"
                placeholder="Paste your routine ID here..."
                value={routineIdInput}
                onChange={(e) => setRoutineIdInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && routineIdInput.trim() && !importing) importRoutineById(); }}
                disabled={importing}
                className="h-12 rounded-xl !bg-gray-50 dark:!bg-gray-900 !border-gray-300 dark:!border-gray-700 text-center text-lg font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:!border-blue-500 focus-visible:!ring-blue-500/20"
              />
            </div>

            <Button
              onClick={importRoutineById}
              disabled={importing || !routineIdInput.trim()}
              className="w-full h-11 rounded-xl !bg-blue-600 hover:!bg-blue-500 !text-white font-semibold transition-colors disabled:opacity-40 !shadow-none"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import Routine
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Share Modal */}
      {sharingRoutineId && (
        <ShareModal
          routineId={sharingRoutineId}
          type={sharingRoutineType}
          onClose={() => setSharingRoutineId(null)}
        />
      )}
    </div>
  );
};
export default SavedRoutinesPage;
