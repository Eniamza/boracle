'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Loader2, User } from "lucide-react";
import { useSession } from 'next-auth/react';
import CreateSwapModal from '@/components/course-swap/CreateSwapModal';
import SwapCard from '@/components/course-swap/SwapCard';
import SwapFilter from '@/components/course-swap/SwapFilter';
import { toast } from 'sonner';
import globalInfo from '@/constants/globalInfo';

const BACKUP_INDEX_URL = 'https://connect-cdn.itzmrz.xyz/connect_backup.json';
const CURRENT_COURSES_URL = 'https://usis-cdn.eniamza.com/connect.json';

const CourseSwapPage = () => {
  const { data: session } = useSession();
  const [currentCourses, setCurrentCourses] = useState([]);
  const [backupIndex, setBackupIndex] = useState(null);
  const [semesterCoursesCache, setSemesterCoursesCache] = useState({});
  const [swaps, setSwaps] = useState([]);
  const [filteredSwaps, setFilteredSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showMySwapsOnly, setShowMySwapsOnly] = useState(false);

  // Current semester from global config
  const currentSemester = globalInfo.semester;

  // Normalize semester format to uppercase (e.g., "Spring2026" -> "SPRING2026", "SPRING26" -> "SPRING2026")
  const normalizeSemester = (semester) => {
    if (!semester) return null;
    // Handle formats: "SPRING26", "Spring2026", "Spring-2026", etc.
    const cleaned = semester.replace(/-/g, '').toUpperCase();
    const match = cleaned.match(/^(SPRING|SUMMER|FALL)(\d{2,4})$/);
    if (!match) return null;
    const season = match[1]; // Keep uppercase
    let year = match[2];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${season}${year}`;
  };

  // Normalized current semester for comparison
  const normalizedCurrentSemester = useMemo(() => {
    return normalizeSemester(currentSemester);
  }, [currentSemester]);

  // Fetch backup index
  useEffect(() => {
    const fetchBackupIndex = async () => {
      try {
        const response = await fetch(BACKUP_INDEX_URL);
        const data = await response.json();
        setBackupIndex(data);
      } catch (error) {
        console.error('Error fetching backup index:', error);
      }
    };
    fetchBackupIndex();
  }, []);

  // Fetch current courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(CURRENT_COURSES_URL);
        const data = await response.json();
        // Handle both array format and object with sections
        const sections = Array.isArray(data) ? data : (data.sections || []);
        setCurrentCourses(sections);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCurrentCourses([]);
      }
    };
    fetchCourses();
  }, []);

  // Fetch swaps
  useEffect(() => {
    fetchSwaps();
  }, []);

  // Fetch backup courses for a specific semester
  const fetchBackupCourses = async (semester) => {
    const normalizedSem = normalizeSemester(semester);
    console.log(`Fetching backup for semester: ${semester} (normalized: ${normalizedSem})`);
    
    if (!normalizedSem || !backupIndex?.backups) {
      console.log('No normalized semester or backup index');
      return null;
    }
    
    // Check cache first
    if (semesterCoursesCache[normalizedSem]) {
      console.log(`Using cached courses for ${normalizedSem}`);
      return semesterCoursesCache[normalizedSem];
    }

    // Find the backup for this semester (get the most recent one if multiple exist)
    const backups = backupIndex.backups
      .filter(b => normalizeSemester(b.semester) === normalizedSem)
      .sort((a, b) => new Date(b.backupTime) - new Date(a.backupTime));
    
    console.log(`Found ${backups.length} backups for ${normalizedSem}:`, backups.map(b => b.cdnLink));
    
    if (backups.length === 0) return null;

    try {
      console.log(`Fetching from: ${backups[0].cdnLink}`);
      const response = await fetch(backups[0].cdnLink);
      const data = await response.json();
      const sections = data.sections || [];
      
      console.log(`Loaded ${sections.length} sections for ${normalizedSem}`);
      
      // Cache the result
      setSemesterCoursesCache(prev => ({
        ...prev,
        [normalizedSem]: sections
      }));
      
      return sections;
    } catch (error) {
      console.error(`Error fetching backup for ${normalizedSem}:`, error);
      return null;
    }
  };

  // Get courses for a specific swap (current or backup based on semester)
  const getCoursesForSwap = (swap) => {
    const swapSemester = normalizeSemester(swap.semester);
    
    // If no semester info or matches current semester, use current courses
    if (!swapSemester || swapSemester === normalizedCurrentSemester) {
      return currentCourses;
    }
    
    // Use cached backup courses if available
    const cachedCourses = semesterCoursesCache[swapSemester];
    if (cachedCourses && cachedCourses.length > 0) {
      return cachedCourses;
    }
    
    // Fallback to current courses while loading
    return currentCourses;
  };

  // Preload backup courses for swaps from previous semesters
  useEffect(() => {
    if (!backupIndex?.backups || swaps.length === 0) return;

    const loadBackupCourses = async () => {
      const semestersToLoad = new Set();
      
      swaps.forEach(swap => {
        const swapSemester = normalizeSemester(swap.semester);
        if (swapSemester && swapSemester !== normalizedCurrentSemester && !semesterCoursesCache[swapSemester]) {
          semestersToLoad.add(swap.semester);
        }
      });

      console.log('Semesters to load backups for:', [...semestersToLoad]);

      for (const semester of semestersToLoad) {
        await fetchBackupCourses(semester);
      }
    };

    loadBackupCourses();
  }, [backupIndex, swaps, normalizedCurrentSemester]);

  useEffect(() => {
    applyFilters();
  }, [swaps, selectedFilters, showMySwapsOnly, session]);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/swap');
      if (response.ok) {
        const data = await response.json();
        setSwaps(data || []);
      }
    } catch (error) {
      console.error('Error fetching swaps:', error);
      setSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (selectedCourseIds) => {
    setSelectedFilters(selectedCourseIds);
  };

  // Get all available courses (current + all cached backups) for filtering
  const allAvailableCourses = useMemo(() => {
    const allCourses = [...currentCourses];
    Object.values(semesterCoursesCache).forEach(courses => {
      courses.forEach(course => {
        if (!allCourses.find(c => c.sectionId === course.sectionId)) {
          allCourses.push(course);
        }
      });
    });
    return allCourses;
  }, [currentCourses, semesterCoursesCache]);

  const applyFilters = () => {
    let filtered = [...swaps];

    // Apply "My Swaps Only" filter first
    if (showMySwapsOnly && session?.user?.email) {
      filtered = filtered.filter(swap => {
        const isMySwap = swap.uEmail?.toLowerCase() === session.user.email?.toLowerCase();
        return isMySwap;
      });
    }

    // Apply course filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(swap => {
        const relatedSections = [
          swap.getSectionId,
          ...(swap.askingSections || [])
        ];
        return relatedSections.some(sectionId => 
          selectedFilters.includes(sectionId)
        );
      });
    }

    setFilteredSwaps(filtered);
  };

  const handleMySwapsToggle = () => {
    setShowMySwapsOnly(!showMySwapsOnly);
  };

  const handleDeleteSwap = async (swapId) => {
    try {
      const response = await fetch(`/api/swap/${swapId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Swap deleted successfully');
        fetchSwaps();
      } else {
        toast.error('Failed to delete swap');
      }
    } catch (error) {
      console.error('Error deleting swap:', error);
      toast.error('Error deleting swap');
    }
  };

  const handleMarkComplete = async (swapId) => {
    try {
      const response = await fetch(`/api/swap/${swapId}`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        toast.success('Swap marked as complete');
        fetchSwaps();
      } else {
        toast.error('Failed to mark swap as complete');
      }
    } catch (error) {
      console.error('Error marking swap as complete:', error);
      toast.error('Error marking swap as complete');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Swap Arena
            </h1>
          </div>
          
          <div className="flex gap-3 items-center">
            {session?.user?.email && (
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">My Swaps Only</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showMySwapsOnly}
                  onClick={handleMySwapsToggle}
                  className={`relative inline-flex h-[24px] w-[44px] items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 ${
                    showMySwapsOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className="sr-only">Toggle my swaps only</span>
                  <span
                    className={`${
                      showMySwapsOnly ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    } pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out`}
                  />
                </button>
              </label>
            )}
            {swaps.length > 0 && (
              <SwapFilter 
                courses={allAvailableCourses}
                swaps={swaps}
                onFilterChange={handleFilterChange}
              />
            )}
            <CreateSwapModal 
              courses={currentCourses} 
              onSwapCreated={fetchSwaps}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-white" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading swaps...</p>
          </div>
        ) : filteredSwaps.length === 0 ? (
          <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <ArrowLeftRight className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {showMySwapsOnly 
                  ? 'You have no active swap requests' 
                  : selectedFilters.length > 0 
                    ? 'No matching swaps found' 
                    : 'No swap requests available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {showMySwapsOnly
                  ? 'Create a new swap request to get started'
                  : selectedFilters.length > 0
                    ? 'Try adjusting your filters or create a new swap request'
                    : 'Be the first to create a swap request!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSwaps.map((swap) => (
              <SwapCard 
                key={swap.swapId} 
                swap={{...swap, email: swap.uEmail}} 
                courses={getCoursesForSwap(swap)}
                onDelete={handleDeleteSwap}
                onMarkComplete={handleMarkComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSwapPage;