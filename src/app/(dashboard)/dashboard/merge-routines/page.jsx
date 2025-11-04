'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  Loader2,
  Users,
  Download,
  Eye,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2canvas from 'html2canvas';

const MergeRoutinesPage = () => {
  const [routineInputs, setRoutineInputs] = useState([
    { id: 1, routineId: '', friendName: '', color: '#3B82F6' }
  ]);
  const [mergedCourses, setMergedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch and merge routines
  const mergeRoutines = async () => {
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
      
      try {
        const response = await fetch(`/api/routine/${input.routineId}`);
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
                originalRoutineId: input.routineId
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
            id: input.routineId,
            name: input.friendName,
            error: data.error || 'Failed to fetch routine'
          });
        }
      } catch (error) {
        console.error(`Error fetching routine ${input.routineId}:`, error);
        failedRoutines.push({
          id: input.routineId,
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

  // Export routine as image
  const exportAsImage = async () => {
    if (!mergedRoutineRef.current) return;

    try {
      const canvas = await html2canvas(mergedRoutineRef.current, {
        backgroundColor: '#111827',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `merged-routine-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Routine exported as image');
    } catch (error) {
      console.error('Error exporting routine:', error);
      toast.error('Failed to export routine');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Users className="h-10 w-10" />
            Merge Friend Routines
          </h1>
          <p className="text-gray-400 mt-2">
            Combine multiple routines to see everyone's schedule in one view
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Add Routines</CardTitle>
                <CardDescription>
                  Enter routine IDs and friend names to merge their schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Get routine IDs from your saved routines or ask friends to share theirs
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {routineInputs.map((input, index) => (
                    <div key={input.id} className="space-y-3 p-4 border rounded-lg dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: input.color }}
                          />
                          <span className="text-sm font-medium">Friend {index + 1}</span>
                        </div>
                        {routineInputs.length > 1 && (
                          <Button
                            onClick={() => removeRoutineInput(input.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`name-${input.id}`}>Friend's Name</Label>
                        <Input
                          id={`name-${input.id}`}
                          placeholder="e.g., John Doe"
                          value={input.friendName}
                          onChange={(e) => updateRoutineInput(input.id, 'friendName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`routine-${input.id}`}>Routine ID</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`routine-${input.id}`}
                            placeholder="e.g., abc123def456"
                            value={input.routineId}
                            onChange={(e) => updateRoutineInput(input.id, 'routineId', e.target.value)}
                            className="flex-1"
                          />
                          {input.routineId && (
                            <Button
                              onClick={() => copyRoutineId(input.routineId)}
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                            >
                              {copiedId === input.routineId ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`color-${input.id}`}>Color</Label>
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
                            className="flex-1"
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

                  <Button
                    onClick={addRoutineInput}
                    variant="outline"
                    className="w-full"
                    disabled={routineInputs.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Friend
                  </Button>

                  <Button
                    onClick={mergeRoutines}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Merging Routines...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Merge & View
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Merged Routine Display */}
          <div className="lg:col-span-2">
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Merged Routine</CardTitle>
                    <CardDescription>
                      Combined view of all friends' schedules
                    </CardDescription>
                  </div>
                  {mergedCourses.length > 0 && (
                    <Button
                      onClick={exportAsImage}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as Image
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
      <div className="bg-gray-900 p-4 rounded-lg">
        {/* Friend Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {friends.map(friend => (
            <div key={friend.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: friend.color }}
              />
              <span className="text-sm text-gray-400">{friend.friendName}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400 w-36">Time/Day</th>
                {days.map(day => (
                  <th key={day} className="text-center py-4 px-3 text-sm font-medium text-gray-400">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot} className="border-b border-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const slotCourses = getCoursesForSlot(day, timeSlot);
                    
                    return (
                      <td key={`${day}-${timeSlot}`} className="p-2 border-l border-gray-800 relative">
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
                                  <div className="text-gray-400 text-xs mt-0.5">
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
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none"
            style={{ 
              left: `${tooltipPosition.x}px`, 
              top: `${tooltipPosition.y}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="space-y-1 text-xs">
              <div className="font-bold">{hoveredCourse.courseCode}-{hoveredCourse.sectionName}</div>
              <div><span className="text-gray-400">Friend:</span> {hoveredCourse.friendName}</div>
              <div><span className="text-gray-400">Credits:</span> {hoveredCourse.courseCredit || 0}</div>
              <div><span className="text-gray-400">Faculty:</span> {hoveredCourse.faculties || 'TBA'}</div>
              <div><span className="text-gray-400">Room:</span> {hoveredCourse.roomName || 'TBA'}</div>
              <div><span className="text-gray-400">Capacity:</span> {hoveredCourse.capacity} ({hoveredCourse.consumedSeat} filled)</div>
              {hoveredCourse.sectionSchedule?.finalExamDetail && (
                <div><span className="text-gray-400">Final:</span> {hoveredCourse.sectionSchedule.finalExamDetail}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergeRoutinesPage;