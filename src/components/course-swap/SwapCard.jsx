'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Calendar, User, ArrowRightLeft, Tag, CheckCircle, Trash2 } from 'lucide-react';

const SwapCard = ({ swap, courses = [], onDelete, onMarkComplete }) => {
  const { data: session } = useSession();
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  if (!swap) return null;
  
  const formatCourse = (course) => {
    return `${course.courseCode}-[${course.sectionName}]`;
  };

  const getCourseBySection = (sectionId) => {
    return courses.find(c => c.sectionId === parseInt(sectionId));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const giveCourse = getCourseBySection(swap.getSectionId);
  const isOwner = session?.user?.email === swap.uEmail;
  
  // Different card styles for owner vs others
  const getCardStyle = () => {
    if (isOwner) {
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800';
    }
    return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
  };

  return (
    <Card className={`relative transition-all hover:shadow-xl ${getCardStyle()} overflow-hidden`}>
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        {swap.isDone ? (
          <Badge className="bg-green-500 text-white border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
            Active
          </Badge>
        )}
      </div>

      <CardHeader className="pb-4">
        {isOwner && (
          <div className="mb-3">
            <Badge className="bg-blue-500 text-white text-xs">
              Your Swap
            </Badge>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Offering Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Offering
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                {giveCourse ? formatCourse(giveCourse) : `Section ${swap.getSectionId}`}
              </p>
              {giveCourse && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {giveCourse.faculties || 'Faculty: TBA'} • {giveCourse.consumedSeat}/{giveCourse.capacity} Seats Consumed
                </p>
              )}
            </div>
          </div>
          
          {/* Looking For Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Looking For
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {swap.askingSections && swap.askingSections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {swap.askingSections.map((sectionId) => {
                    const askCourse = getCourseBySection(sectionId);
                    return (
                      <Badge 
                        key={sectionId} 
                        variant="outline" 
                        className="bg-white dark:bg-gray-900 border-purple-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onMouseEnter={(e) => {
                          if (askCourse) {
                            setHoveredCourse(askCourse);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const viewportWidth = window.innerWidth;
                            const tooltipWidth = 384;
                            const shouldShowLeft = rect.right + tooltipWidth + 10 > viewportWidth;
                            setTooltipPosition({ 
                              x: shouldShowLeft ? rect.left - tooltipWidth - 10 : rect.right + 10, 
                              y: rect.top 
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCourse(null)}
                      >
                        {askCourse ? formatCourse(askCourse) : `Section ${sectionId}`}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">Any section of the same course</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="border-t bg-gray-50/50 dark:bg-gray-800/50">
        {/* User Info */}
        <div className="flex items-center justify-between py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {swap.uEmail || 'Unknown user'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(swap.createdAt)}
            </div>
          </div>
          
          {/* Action Buttons */}
          {isOwner && (
            <div className="flex gap-2">
              {!swap.isDone && (
                <Button 
                  size="sm"
                  onClick={() => onMarkComplete?.(swap.swapId)}
                  className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button 
                size="sm"
                onClick={() => onDelete?.(swap.swapId)}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hover Tooltip for "Looking For" Courses */}
      {hoveredCourse && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-xl w-96 pointer-events-none"
          style={{ 
            left: `${Math.max(10, Math.min(tooltipPosition.x, typeof window !== 'undefined' ? window.innerWidth - 394 : 800))}px`, 
            top: `${tooltipPosition.y}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
            <div className="font-bold text-lg">{hoveredCourse.courseCode}-{hoveredCourse.sectionName}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Credits:</span> {hoveredCourse.courseCredit}</div>
            
            {/* Faculty Information */}
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded p-2 space-y-1">
              <div className="font-medium text-blue-600 dark:text-blue-400">Faculty Information</div>
              <div><span className="text-gray-500 dark:text-gray-400">Initial:</span> {hoveredCourse.faculties || 'TBA'}</div>
              {hoveredCourse.employeeName && (
                <div><span className="text-gray-500 dark:text-gray-400">Name:</span> {hoveredCourse.employeeName}</div>
              )}
              {hoveredCourse.employeeEmail && (
                <div><span className="text-gray-500 dark:text-gray-400">Email:</span> {hoveredCourse.employeeEmail}</div>
              )}
            </div>
            
            <div><span className="text-gray-500 dark:text-gray-400">Type:</span> {hoveredCourse.sectionType}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Capacity:</span> {hoveredCourse.capacity} (Filled: {hoveredCourse.consumedSeat})</div>
            <div><span className="text-gray-500 dark:text-gray-400">Prerequisites:</span> {hoveredCourse.prerequisiteCourses || 'None'}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Room:</span> {hoveredCourse.roomName || 'TBA'}</div>
            {hoveredCourse.labCourseCode && (
              <div><span className="text-gray-500 dark:text-gray-400">Lab:</span> {hoveredCourse.labCourseCode} - {hoveredCourse.labRoomName}</div>
            )}
            <div><span className="text-gray-500 dark:text-gray-400">Mid Exam:</span> {hoveredCourse.sectionSchedule?.midExamDetail || 'TBA'}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Final Exam:</span> {hoveredCourse.sectionSchedule?.finalExamDetail || 'TBA'}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Class Period:</span> {hoveredCourse.sectionSchedule?.classStartDate} to {hoveredCourse.sectionSchedule?.classEndDate}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SwapCard;