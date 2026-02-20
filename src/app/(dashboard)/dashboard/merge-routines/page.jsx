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
import { exportRoutineToPNG } from '@/components/routine/ExportRoutinePNG';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

import { useLocalStorage } from '@/hooks/use-local-storage';
import CourseHoverTooltip from '@/components/ui/CourseHoverTooltip';
import { getRoutineTimings, REGULAR_TIMINGS } from '@/constants/routineTimings';
import { copyToClipboard } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMergedRoutineView from '@/components/routine/MobileMergedRoutineView';
import RoutineSelectorSheet from '@/components/routine/RoutineSelectorSheet';

const MergeRoutinesPage = () => {
  const isMobile = useIsMobile();
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
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
  const [userSavedRoutines, setUserSavedRoutines] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  // State for the mobile routine selector sheet
  const [selectorSheetOpen, setSelectorSheetOpen] = useState(false);
  const [selectorSheetInputId, setSelectorSheetInputId] = useState(null);

  // Fetch user's saved routines on mount
  useEffect(() => {
    if (session?.user?.email) {
      // Fetch saved routines
      const fetchSavedRoutines = async () => {
        try {
          const response = await fetch('/api/routine');
          if (response.ok) {
            const data = await response.json();
            const routinesWithIndex = (data.routines || [])
              .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
              .map((routine, idx) => ({ ...routine, routineNumber: idx + 1 }))
              .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
            setUserSavedRoutines(routinesWithIndex);
          }
        } catch (error) {
          console.error('Error fetching saved routines:', error);
        }
      };

      fetchSavedRoutines();

      // Fetch faculty data
      fetch('/api/faculty/lookup')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFacultyMap(data.facultyMap);
            // Re-enrich currently merged courses if any
            setMergedCourses(prev => prev.map(course => {
              const firstInitial = course.faculties?.split(',')[0]?.trim().toUpperCase();
              const facultyInfo = data.facultyMap[firstInitial];
              return {
                ...course,
                employeeName: facultyInfo?.facultyName || null,
                employeeEmail: facultyInfo?.email || null,
                imgUrl: facultyInfo?.imgUrl || null,
              };
            }));
          }
        })
        .catch(err => console.error('Error fetching faculty data:', err));
    }
  }, [session]);

  const mergedRoutineRef = useRef(null);
  const exportRef = useRef(null);

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

    // Clear validation error for this field
    if (validationErrors[id]?.[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: false }
      }));
    }
  };

  // Copy routine ID to clipboard
  const copyRoutineId = async (routineId) => {
    const success = await copyToClipboard(routineId);
    if (success) {
      setCopiedId(routineId);
      toast.success('Routine ID copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
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

    // Check for incomplete inputs (ID provided but Name missing, or vice versa)
    const errors = {};
    let hasFunctionError = false;

    routineInputs.forEach(r => {
      const hasId = !!r.routineId.trim();
      const hasName = !!r.friendName.trim();

      // If one exists but not other, mark missing one as error
      if (hasId && !hasName) {
        errors[r.id] = { ...errors[r.id], friendName: true };
        hasFunctionError = true;
      }
      if (!hasId && hasName) {
        errors[r.id] = { ...errors[r.id], routineId: true };
        hasFunctionError = true;
      }
    });

    if (hasFunctionError) {
      setValidationErrors(errors);
      toast.error('Both Routine ID and Friend Name are required for all entries');
      return;
    } else {
      setValidationErrors({});
    }

    // Validate inputs - Filter out completely empty rows (if allowed) or just use all since we validated partials
    const validInputs = routineInputs.filter(r => r.routineId.trim() && r.friendName.trim());

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
                  originalRoutineId: trimmedRoutineId,
                  employeeName: facultyMap[course.faculties?.split(',')[0]?.trim().toUpperCase()]?.facultyName || null,
                  employeeEmail: facultyMap[course.faculties?.split(',')[0]?.trim().toUpperCase()]?.email || null,
                  imgUrl: facultyMap[course.faculties?.split(',')[0]?.trim().toUpperCase()]?.imgUrl || null
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

  // Export routine as image using centralized utility
  const exportAsImage = async () => {
    if (mergedCourses.length === 0) {
      toast.error('No courses to export');
      return;
    }

    const ref = isMobile ? exportRef : mergedRoutineRef;
    if (!ref?.current) {
      toast.error('Routine table not found');
      return;
    }

    await exportRoutineToPNG({
      routineRef: ref,
      filename: 'merged-routine',
      showToast: true,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-4 py-4 sm:py-8">
        {/* <div className="mb-8 px-2 sm:px-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 sm:h-10 sm:w-10" />
            Merge Friend Routines
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Combine multiple routines to see everyone's schedule in one view
          </p>
        </div> */}

        <div className="flex flex-col gap-6">
          {/* Input Section - Now on top */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
              <CardTitle className="text-gray-900 dark:text-white">Add Routines</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Enter routine IDs and friend names to merge their schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="px-1.5 pb-4 sm:px-6 sm:pb-6">
              <Alert className="mb-4 mx-1.5 sm:mx-0 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-gray-700 dark:text-gray-300">
                  Get routine IDs from your saved routines or ask friends to share theirs
                </AlertDescription>
              </Alert>

              {/* Horizontal scrollable cards for friend inputs */}
              <div className="overflow-hidden">
                <div
                  className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-smooth"
                  onScroll={(e) => {
                    if (isMobile) {
                      const container = e.target;
                      const children = Array.from(container.children);
                      let closestIdx = 0;
                      let closestDist = Infinity;
                      const containerCenter = container.scrollLeft + container.clientWidth / 2;
                      children.forEach((child, i) => {
                        const childCenter = child.offsetLeft + child.offsetWidth / 2;
                        const dist = Math.abs(containerCenter - childCenter);
                        if (dist < closestDist) {
                          closestDist = dist;
                          closestIdx = i;
                        }
                      });
                      if (closestIdx !== currentFriendIndex) {
                        setCurrentFriendIndex(closestIdx);
                      }
                    }
                  }}
                >
                  {routineInputs.map((input, index) => (
                    <div key={input.id} className="flex-shrink-0 w-[calc(100%-1rem)] sm:w-72 space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 snap-start">
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
                          className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${validationErrors[input.id]?.friendName
                            ? 'border-red-500 dark:border-red-500 border-2 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}
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
                            className={`flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${hasDuplicateRoutineId(input.routineId) || validationErrors[input.id]?.routineId
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

                        {/* Saved Routine Selector */}
                        {userSavedRoutines.length > 0 && (
                          <div className="mt-2">
                            {isMobile ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs flex items-center justify-between w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300"
                                onClick={() => {
                                  setSelectorSheetInputId(input.id);
                                  setSelectorSheetOpen(true);
                                }}
                              >
                                {(() => {
                                  const matched = userSavedRoutines.find(r => r.id === input.routineId.trim());
                                  return matched ? (
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                      {matched.routineName || `Routine #${matched.routineNumber}`}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Select Saved Routine</span>
                                  );
                                })()}
                                <ChevronDown className="h-3 w-3 opacity-50 ml-2" />
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className=" text-xs flex items-center justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300"
                                  >
                                    {(() => {
                                      const matched = userSavedRoutines.find(r => r.id === input.routineId.trim());
                                      return matched ? (
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {matched.routineName || `Routine #${matched.routineNumber}`}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">Select Saved Routine</span>
                                      );
                                    })()}
                                    <ChevronDown className="h-3 w-3 opacity-50 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[200px] max-h-[240px] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                  <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">My Saved Routines</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                                  {userSavedRoutines.map((routine) => (
                                    <DropdownMenuItem
                                      key={routine.id}
                                      onClick={() => updateRoutineInput(input.id, 'routineId', routine.id)}
                                      className="flex flex-col items-start gap-0.5 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
                                    >
                                      <span className={`text-sm font-medium ${input.routineId === routine.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {routine.routineName || `Routine #${routine.routineNumber}`}
                                      </span>
                                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {new Date(Number(routine.createdAt) * 1000).toLocaleString(undefined, {
                                          dateStyle: 'medium',
                                          timeStyle: 'short'
                                        })}
                                      </span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
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
              </div>

              {isMobile && routineInputs.length > 1 && (
                <div className="flex justify-center gap-2 mt-2 mb-2">
                  {routineInputs.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentFriendIndex ? 'w-4 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                    />
                  ))}
                </div>
              )}

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
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Merged Routine</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Merged view of all homies' schedules
                  </CardDescription>
                </div>
                {mergedCourses.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={saveMergedRoutine}
                      disabled={savingRoutine || !session}
                      className={`bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors text-white ${isMobile ? 'p-2' : 'px-4 py-2'}`}
                      title="Save to Cloud"
                    >
                      {savingRoutine ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {!isMobile && (savingRoutine ? 'Saving...' : 'Save to Cloud')}
                    </button>
                    <button
                      onClick={exportAsImage}
                      className={`bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white ${isMobile ? 'p-2' : 'px-4 py-2'}`}
                      title="Save as PNG"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {!isMobile && 'Save as PNG'}
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0.5 pb-3 sm:px-6 sm:pb-6">
              {/* The Routine Gets Loaded Here*/}
              {/* Saihan: why was this so hard to find :| */}
              {mergedCourses.length > 0 ? (
                <>
                  {isMobile ? (
                    <>
                      <MobileMergedRoutineView
                        courses={mergedCourses}
                        friends={routineInputs.filter(r => r.routineId && r.friendName)}
                      />
                      {/* Hidden Desktop Table For Export */}
                      <div
                        style={{
                          position: 'fixed',
                          left: 0,
                          top: 0,
                          width: '1800px',
                          opacity: 0,
                          pointerEvents: 'none',
                          zIndex: -1,
                          overflow: 'visible',
                        }}
                        aria-hidden="true"
                      >
                        <div ref={exportRef}>
                          <MergedRoutineGrid
                            courses={mergedCourses}
                            friends={routineInputs.filter(r => r.routineId && r.friendName)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div ref={mergedRoutineRef}>
                      <MergedRoutineGrid
                        courses={mergedCourses}
                        friends={routineInputs.filter(r => r.routineId && r.friendName)}
                      />
                    </div>
                  )}
                </>
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

      {/* Mobile Routine Selector Sheet */}
      <RoutineSelectorSheet
        isOpen={selectorSheetOpen}
        onClose={() => {
          setSelectorSheetOpen(false);
          setSelectorSheetInputId(null);
        }}
        routines={userSavedRoutines}
        selectedRoutineId={selectorSheetInputId ? routineInputs.find(r => r.id === selectorSheetInputId)?.routineId?.trim() : null}
        onSelect={(routineId) => {
          if (selectorSheetInputId) {
            updateRoutineInput(selectorSheetInputId, 'routineId', routineId);
          }
        }}
      />
    </div>
  );
};

// Modified RoutineTableGrid Component for Merged View
const MergedRoutineGrid = ({ courses, friends }) => {
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredCourseTitle, setHoveredCourseTitle] = useState(null);

  const timeSlots = getRoutineTimings();

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
              {timeSlots.map((timeSlot, index) => {
                const matchSlot = REGULAR_TIMINGS[index];
                return (
                  <tr key={timeSlot} className="border-b border-gray-300 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-300 dark:border-gray-700">
                      {timeSlot}
                    </td>
                    {days.map(day => {
                      const slotCourses = getCoursesForSlot(day, matchSlot);

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
                                  const slotStartMin = timeToMinutes(matchSlot.split('-')[0]);
                                  const slotEndMin = timeToMinutes(matchSlot.split('-')[1]);
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
                                      setHoveredCourseTitle(`${course.courseCode}${isLab ? 'L' : ''}`);
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const viewportWidth = window.innerWidth;
                                      const tooltipWidth = 384; // w-96 = 384px
                                      const shouldShowLeft = rect.right + tooltipWidth + 10 > viewportWidth;

                                      setTooltipPosition({
                                        x: shouldShowLeft ? rect.left - tooltipWidth - 10 : rect.right + 10,
                                        y: rect.top
                                      });
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCourse(null);
                                      setHoveredCourseTitle(null);
                                    }}
                                  >
                                    <div className="font-semibold">
                                      {course.courseCode}{isLab && 'L'}-{course.sectionName}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                      {course.friendName}
                                    </div>
                                    {course.roomName && (
                                      <div className="text-gray-500 text-xs">
                                        {isLab ? course.labRoomName || course.labRoomNumber || 'TBA' : course.roomName || course.roomNumber || 'TBA'}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tooltip */}
        <CourseHoverTooltip
          course={hoveredCourse}
          position={tooltipPosition}
          courseTitle={hoveredCourseTitle}
          extraFields={hoveredCourse ? [{ label: 'Friend', value: hoveredCourse.friendName }] : []}
        />

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Made with 💖 from https://oracle.eniamza.com
        </div>
      </div>
    </div>
  );
};

export default MergeRoutinesPage;