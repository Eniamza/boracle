'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Loader2,
  Users,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Save
} from "lucide-react";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as htmlToImage from 'html-to-image';
import { useSession } from 'next-auth/react';

import { useLocalStorage } from '@/hooks/use-local-storage';

const MergeRoutinesPage = () => {
  const { data: session } = useSession();
  // Use local storage for routine inputs
  const [routineInputs, setRoutineInputs] = useLocalStorage('boracle_merge_inputs', [
    { id: 1, routineId: '', friendName: '', color: '#3B82F6' }
  ]);


  const [mergedCourses, setMergedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [loadingRoutines, setLoadingRoutines] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const mergedRoutineRef = useRef(null);

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
  ];

  // Detect duplicate routine IDs
  const duplicateRoutineIds = useMemo(() => {
    const routineIdCounts = {};
    const duplicates = new Set();
    
    routineInputs.forEach(input => {
      const trimmedId = input.routineId.trim().toLowerCase();
      if (trimmedId) {
        if (routineIdCounts[trimmedId]) {
          duplicates.add(trimmedId);
        } else {
          routineIdCounts[trimmedId] = true;
        }
      }
    });
    
    return duplicates;
  }, [routineInputs]);

  // Check if a specific input has a duplicate routine ID
  const hasDuplicateRoutineId = (routineId) => {
    return duplicateRoutineIds.has(routineId.trim().toLowerCase());
  };

  // Add new routine input
  const addRoutineInput = () => {
    const newId = Math.max(...routineInputs.map(r => r.id)) + 1;
    const nextColorIndex = routineInputs.length % colorPalette.length;
    setRoutineInputs([
      ...routineInputs,
      { id: newId, routineId: '', friendName: '', color: colorPalette[nextColorIndex] }
    ]);
  };



  // Remove routine input
  const removeRoutineInput = (id) => {
    if (routineInputs.length > 1) {
      setRoutineInputs(routineInputs.filter(r => r.id !== id));
    }
  };

  // Update routine input
  const updateRoutineInput = (id, field, value) => {
    setRoutineInputs(routineInputs.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // Copy routine ID to clipboard
  const copyRoutineId = async (routineId) => {
    try {
      await navigator.clipboard.writeText(routineId);
      setCopiedId(routineId);
      toast.success('Routine ID copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy routine ID');
    }
  };

  // Save merged routine to database
  const saveMergedRoutine = async () => {
    if (!session?.user?.email) {
      toast.error('Please login to save your merged routine');
      return;
    }

    if (mergedCourses.length === 0) {
      toast.error('Please merge some routines first');
      return;
    }

    setSavingRoutine(true);

    try {
      // Build the routine data structure with friend names and their section IDs
      const routineData = routineInputs
        .filter(r => r.routineId && r.friendName)
        .map(input => {
          const friendCourses = mergedCourses.filter(c => c.friendName === input.friendName);
          return {
            friendName: input.friendName,
            sectionIds: friendCourses.map(c => c.sectionId)
          };
        })
        .filter(item => item.sectionIds.length > 0);

      const response = await fetch('/api/merged-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routineData: JSON.stringify(routineData)
        }),
      });

      if (response.ok) {
        toast.success('Merged routine saved successfully!');
      } else {
        throw new Error('Failed to save merged routine');
      }
    } catch (error) {
      console.error('Error saving merged routine:', error);
      toast.error('Failed to save merged routine. Please try again.');
    } finally {
      setSavingRoutine(false);
    }
  };

  // Fetch and merge routines
  const mergeRoutines = async () => {
    // Check for duplicate routine IDs
    if (duplicateRoutineIds.size > 0) {
      toast.error('Please remove duplicate routine IDs before merging');
      return;
    }

    // Validate inputs
    const validInputs = routineInputs.filter(r => r.routineId && r.friendName);
    if (validInputs.length === 0) {
      toast.error('Please add at least one routine with ID and friend name');
      return;
    }

    setLoading(true);
    setMergedCourses([]);
    const allCourses = [];
    const failedRoutines = [];

    // First, fetch all available courses from the external API
    let allAvailableCourses = [];
    try {
      const coursesResponse = await fetch('https://usis-cdn.eniamza.com/connect.json');
      allAvailableCourses = await coursesResponse.json();
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to fetch course data');
      setLoading(false);
      return;
    }

    for (const input of validInputs) {
      setLoadingRoutines(prev => ({ ...prev, [input.id]: true }));

      // Sanitization: Trim whitespace from routine ID
      const trimmedRoutineId = input.routineId.trim();

      try {
        // Handle Fetched Routines
        {
          const response = await fetch(`/api/routine/${trimmedRoutineId}`);
          const data = await response.json();

          if (response.ok && data.success) {
            // Decode the base64 encoded section IDs
            const sectionIds = JSON.parse(atob(data.routine.routineStr || ''));

            // Find courses by section IDs
            const coursesForThisRoutine = sectionIds.map(sectionId => {
              const course = allAvailableCourses.find(c => c.sectionId === sectionId);
              if (course) {
                return {
                  ...course,
                  friendName: input.friendName,
                  friendColor: input.color,
                  originalRoutineId: trimmedRoutineId
                };
              }
              return null;
            }).filter(Boolean); // Remove null values

            allCourses.push(...coursesForThisRoutine);

            if (coursesForThisRoutine.length !== sectionIds.length) {
              const missingCount = sectionIds.length - coursesForThisRoutine.length;
              toast.warning(`${input.friendName}: ${missingCount} course(s) not found in current semester data`);
            }
          } else {
            failedRoutines.push({
              id: trimmedRoutineId,
              name: input.friendName,
              error: data.error || 'Failed to fetch routine'
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching routine ${trimmedRoutineId}:`, error);
        failedRoutines.push({
          id: trimmedRoutineId,
          name: input.friendName,
          error: 'Network error'
        });
      } finally {
        setLoadingRoutines(prev => ({ ...prev, [input.id]: false }));
      }
    }

    if (failedRoutines.length > 0) {
      failedRoutines.forEach(f => {
        toast.error(`Failed to load ${f.name}'s routine: ${f.error}`);
      });
    }

    if (allCourses.length > 0) {
      setMergedCourses(allCourses);
      toast.success(`Successfully merged ${validInputs.length - failedRoutines.length} routine(s) with ${allCourses.length} courses`);
    } else {
      toast.error('No courses could be loaded from the routines');
    }

    setLoading(false);
  };

  // Export routine as image using html-to-image
  const exportAsImage = async () => {
    if (!mergedRoutineRef.current) {
      toast.error('Routine table not found');
      return;
    }

    if (mergedCourses.length === 0) {
      toast.error('No courses to export');
      return;
    }

    // Store original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalRoutineSegment = mergedRoutineRef.current;
    if (!originalRoutineSegment) return;

    const scrolledWidth = 1800; // ! FORCE a standard desktop width- Change to increase downloaded image's width

    // ? Hidden container for the cloned routine segment
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = scrolledWidth + 'px';

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

    try {
      const dataUrl = await htmlToImage.toPng(clonedRoutine, {
        quality: 0.95,
        pixelRatio: 3, // ! Higher number -> Higher resolution -> Larger file size (Maybe add a slider on client side for them to adjust this in the future?) 
        backgroundColor: '#111827',
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
    } finally {
      // Restore original styles (if any were modified on the main document)
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Restore overflow on all elements
      originalOverflows.forEach(({ element, overflow, overflowX, overflowY }) => {
        element.style.overflow = overflow;
        element.style.overflowX = overflowX;
        element.style.overflowY = overflowY;
      });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-10 w-10" />
            Merge Friend Routines
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Combine multiple routines to see everyone's schedule in one view
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Input Section - Now on top */}
          <Card className="bg-white dark:bg-gray-900/50 backdrop-blur border border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Add Routines</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter routine IDs and friend names to merge their schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-gray-700 dark:text-gray-300">
                  Get routine IDs from your saved routines or ask friends to share theirs
                </AlertDescription>
              </Alert>

              {/* Horizontal scrollable cards for friend inputs */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {routineInputs.map((input, index) => (
                  <div key={input.id} className="flex-shrink-0 w-72 space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: input.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Friend {index + 1}</span>
                      </div>
                      {routineInputs.length > 1 && (
                        <Button
                          onClick={() => removeRoutineInput(input.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`name-${input.id}`} className="text-gray-700 dark:text-gray-300">Friend's Name</Label>
                      <Input
                        id={`name-${input.id}`}
                        placeholder="e.g., John Doe"
                        value={input.friendName}
                        onChange={(e) => updateRoutineInput(input.id, 'friendName', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`routine-${input.id}`} className="text-gray-700 dark:text-gray-300">Routine ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`routine-${input.id}`}
                          placeholder="e.g., abc123def456"
                          value={input.routineId}
                          onChange={(e) => updateRoutineInput(input.id, 'routineId', e.target.value)}
                          className={`flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            hasDuplicateRoutineId(input.routineId) 
                              ? 'border-red-500 dark:border-red-500 border-2 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {input.routineId && (
                          <Button
                            onClick={() => copyRoutineId(input.routineId)}
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {copiedId === input.routineId ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      {hasDuplicateRoutineId(input.routineId) && (
                        <p className="text-red-500 text-sm mt-1">
                          Each routine ID must be unique.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`color-${input.id}`} className="text-gray-700 dark:text-gray-300">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`color-${input.id}`}
                          type="color"
                          value={input.color}
                          onChange={(e) => updateRoutineInput(input.id, 'color', e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          value={input.color}
                          onChange={(e) => updateRoutineInput(input.id, 'color', e.target.value)}
                          className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    {loadingRoutines[input.id] && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading routine...
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4 justify-center">


                <Button
                  onClick={addRoutineInput}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-blue-700 dark:bg-blue-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-blue-800"
                  disabled={routineInputs.length >= 10}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Add Another Friend</span>
                </Button>

                <Button
                  onClick={mergeRoutines}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      <span>Merging...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 shrink-0" />
                      <span>Merge & View</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Merged Routine Display - Now below */}
          <Card className="bg-white dark:bg-gray-900/50 backdrop-blur border border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Merged Routine</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Combined view of all friends' schedules
                  </CardDescription>
                </div>
                {mergedCourses.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={saveMergedRoutine}
                      disabled={savingRoutine || !session}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors text-white"
                    >
                      {savingRoutine ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {savingRoutine ? 'Saving...' : 'Save to Cloud'}
                    </button>
                    <button
                      onClick={exportAsImage}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Save as PNG
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* The Routine Gets Loaded Here*/}
              {/* Saihan: why was this so hard to find :| */}
              {mergedCourses.length > 0 ? (
                <div ref={mergedRoutineRef}>
                  <MergedRoutineGrid
                    courses={mergedCourses}
                    friends={routineInputs.filter(r => r.routineId && r.friendName)}
                  />
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Add routine IDs and click "Merge & View" to see the combined schedule
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Modified RoutineTableGrid Component for Merged View
const MergedRoutineGrid = ({ courses, friends }) => {
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

  return (
    <div className="w-full">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
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
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-36 border-r border-gray-300 dark:border-gray-700">Time/Day</th>
                {days.map(day => (
                  <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot} className="border-b border-gray-300 dark:border-gray-700">
                  <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-300 dark:border-gray-700">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const slotCourses = getCoursesForSlot(day, timeSlot);

                    return (
                      <td key={`${day}-${timeSlot}`} className="p-2 border-r border-gray-300 dark:border-gray-700 last:border-r-0 relative">
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
                                  className="p-2 rounded text-xs transition-opacity hover:opacity-90 cursor-pointer text-gray-900 dark:text-gray-100"
                                  style={{
                                    backgroundColor: `${course.friendColor}30`,
                                    borderLeft: `3px solid ${course.friendColor}`
                                  }}
                                  onMouseEnter={(e) => {
                                    setHoveredCourse(course);
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipPosition({
                                      x: rect.right + 10,
                                      y: rect.top
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredCourse(null)}
                                >
                                  <div className="font-semibold">
                                    {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                    {course.friendName}
                                  </div>
                                  {course.roomName && (
                                    <div className="text-gray-500 text-xs">
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
        {hoveredCourse && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="space-y-1 text-xs text-gray-900 dark:text-gray-100">
              <div className="font-bold">{hoveredCourse.courseCode}-{hoveredCourse.sectionName}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Friend:</span> {hoveredCourse.friendName}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Credits:</span> {hoveredCourse.courseCredit || 0}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Faculty:</span> {hoveredCourse.faculties || 'TBA'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Room:</span> {hoveredCourse.roomName || 'TBA'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Capacity:</span> {hoveredCourse.capacity} ({hoveredCourse.consumedSeat} filled)</div>
              {hoveredCourse.sectionSchedule?.finalExamDetail && (
                <div><span className="text-gray-500 dark:text-gray-400">Final:</span> {hoveredCourse.sectionSchedule.finalExamDetail}</div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Made with 💖 from https://oracle.eniamza.com
        </div>
      </div>
    </div>
  );
};

export default MergeRoutinesPage;