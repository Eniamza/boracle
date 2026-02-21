'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CourseHoverTooltip from "@/components/ui/CourseHoverTooltip";
import { useSession } from 'next-auth/react';
import { Calendar, User, ArrowRightLeft, Tag, CheckCircle, Trash2, Mail, ChevronDown, ChevronUp } from 'lucide-react';

const SwapCard = ({ swap, courses = [], onDelete, onMarkComplete, onCourseClick, isMobile = false }) => {
  const { data: session } = useSession();
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false); // Can be enhanced later to check initial status

  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const tagsContainerRef = useRef(null);

  useEffect(() => {
    const checkHeight = () => {
      if (tagsContainerRef.current) {
        // A single row with badges normally takes ~34px height. Anything significantly above that means multiple rows.
        setShowToggle(tagsContainerRef.current.scrollHeight > 45);
      }
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, [swap.askingSections]);

  if (!swap) return null;

  const formatCourse = (course) => {
    return `${course.courseCode}-${course.sectionName}-${course.faculties || 'TBA'}`;
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
  const isOwner = swap.isOwner;

  // Different card styles for owner vs others and completed status
  const getCardStyle = () => {
    if (swap.isDone) {
      // Completed/inactive swap - muted appearance
      return 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700';
    }
    if (isOwner) {
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800';
    }
    return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
  };

  const handleRequestSwap = async () => {
    if (!session?.user?.email) {
      import('sonner').then(({ toast }) => toast.error('Please login to request a swap'));
      return;
    }

    try {
      setIsRequesting(true);
      const response = await fetch('/api/swap/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapId: swap.swapId })
      });

      const data = await response.json();

      if (response.ok) {
        import('sonner').then(({ toast }) => toast.success('Swap request sent!'));
        setHasRequested(true);
      } else {
        import('sonner').then(({ toast }) => toast.error(data.error || 'Failed to send request'));
      }
    } catch (error) {
      console.error('Error requesting swap:', error);
      import('sonner').then(({ toast }) => toast.error('Error sending request'));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card className={`relative transition-all hover:shadow-xl ${getCardStyle()} ${hoveredCourse ? 'z-[60] overflow-visible' : 'z-0 overflow-hidden'}`}>
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        {swap.isDone ? (
          <Badge className=" text-white dark:text-white border-0 dark:bg-red-800 bg-red-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        ) : (
          <Badge variant="secondary" className="dark:bg-gray-800 bg-green-500 text-white">
            Active
          </Badge>
        )}
      </div>

      <CardHeader className="px-3 md:px-6 pb-4">
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
            {/* I am working here */}
            <div
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onMouseEnter={(e) => {
                if (giveCourse) {
                  setHoveredCourse(giveCourse);
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
              onClick={() => giveCourse && onCourseClick?.(giveCourse)}
            >
              <p className="font-bold text-base md:text-lg text-gray-900 dark:text-white break-words">
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
                <div className="flex flex-col gap-2">
                  <div
                    ref={tagsContainerRef}
                    className={`flex flex-wrap gap-2 ${isExpanded ? '' : 'max-h-[36px] overflow-hidden'}`}
                  >
                    {swap.askingSections.map((sectionId) => {
                      const askCourse = getCourseBySection(sectionId);
                      return (
                        <Badge
                          key={sectionId}
                          variant="outline"
                          className="px-3 py-1.5 text font-medium
                          bg-white dark:bg-gray-900 
                          border-purple-300 dark:border-blue-700 
                          text-blue-700 dark:text-blue-400 
                          cursor-pointer 
                          hover:bg-purple-50 dark:hover:bg-blue-900/30 
                          hover:border-purple-400 dark:hover:border-blue-600
                          hover:shadow-sm
                          transition-all duration-200"
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
                          onClick={() => askCourse && onCourseClick?.(askCourse)}
                        >
                          {askCourse ? formatCourse(askCourse) : `Section ${sectionId}`}
                        </Badge>
                      );
                    })}
                  </div>
                  {showToggle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 self-start flex items-center gap-1 mt-1 outline-none"
                    >
                      {isExpanded ? (
                        <>Show less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Show more ({swap.askingSections.length} sections) <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Any section of the same course</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 md:px-6 py-3 border-t bg-gray-200/60 dark:bg-gray-800/50">
        {/* User Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0 flex-1">
            <Calendar className="w-3 h-3 shrink-0" />
            {formatDate(swap.createdAt)}
          </div>

          {/* Action Buttons */}
          {isOwner ? (
            <div className="flex gap-2 w-full sm:w-auto">
              {!swap.isDone && (
                <Button
                  size="sm"
                  onClick={() => onMarkComplete?.(swap.swapId)}
                  className="flex-1 sm:flex-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white bg-green-500 hover:bg-green-600 text-white"
                  title="Mark as Done"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="ml-1">Done</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onDelete?.(swap.swapId)}
                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white dark:text-white"
                title="Delete Swap"
              >
                <Trash2 className="w-4 h-4" />
                <span className="ml-1">Delete</span>
              </Button>
            </div>
          ) : session?.user?.email && !swap.isDone ? (
            <Button
              size="sm"
              onClick={handleRequestSwap}
              disabled={isRequesting || hasRequested}
              className={`w-full sm:w-auto gap-2 ${hasRequested
                ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white'
                }`}
              title="Request Swap directly"
            >
              {isRequesting ? (
                <>Sending... <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span></>
              ) : hasRequested ? (
                <>Requested <CheckCircle className="w-4 h-4" /></>
              ) : (
                <>Request Swap <Mail className="w-4 h-4" /></>
              )}
            </Button>
          ) : null}
        </div>
      </CardContent>

      {/* Hover Tooltip for "Looking For" Courses */}
      {!isMobile && <CourseHoverTooltip course={hoveredCourse} position={tooltipPosition} />}
    </Card>
  );
};

export default SwapCard;