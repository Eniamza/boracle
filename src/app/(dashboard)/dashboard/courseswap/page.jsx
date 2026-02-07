'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Loader2, User } from "lucide-react";
import { useSession } from 'next-auth/react';
import CreateSwapModal from '@/components/course-swap/CreateSwapModal';
import SwapCard from '@/components/course-swap/SwapCard';
import SwapFilter from '@/components/course-swap/SwapFilter';
import { toast } from 'sonner';

const CourseSwapPage = () => {
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [filteredSwaps, setFilteredSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showMySwapsOnly, setShowMySwapsOnly] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://usis-cdn.eniamza.com/connect.json');
        const data = await response.json();
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchSwaps();
  }, []);

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

  const applyFilters = () => {
    let filtered = [...swaps];

    // Apply "My Swaps Only" filter first
    if (showMySwapsOnly && session?.user?.email) {
      filtered = filtered.filter(swap => {
        const isMySwap = swap.uemail?.toLowerCase() === session.user.email?.toLowerCase();
        return isMySwap;
      });
    }

    // Apply course filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(swap => {
        const relatedSections = [
          swap.getsectionid,
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
                courses={courses}
                swaps={swaps}
                onFilterChange={handleFilterChange}
              />
            )}
            <CreateSwapModal 
              courses={courses} 
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
                courses={courses}
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