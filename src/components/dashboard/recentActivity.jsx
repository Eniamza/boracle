"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Calendar, ExternalLink, User, BookOpen, Clock } from "lucide-react";

export default function RecentActivity() {
  const [activities, setActivities] = useState(null);
  const [facultyData, setFacultyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to fetch faculty information
  const fetchFacultyInfo = async (facultyId) => {
    try {
      const response = await fetch(`/api/faculty/${facultyId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch faculty ${facultyId}`);
      }
      const faculty = await response.json();
      return faculty;
    } catch (err) {
      console.error(`Error fetching faculty ${facultyId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/recentActivity');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setActivities(data.recentActivities);

        // Fetch faculty information for reviews
        if (data.recentActivities?.reviews) {
          const facultyPromises = data.recentActivities.reviews.map(review => 
            fetchFacultyInfo(review.facultyid)
          );
          
          const facultyResults = await Promise.all(facultyPromises);
          
          // Create a map of facultyId to faculty data
          const facultyMap = {};
          data.recentActivities.reviews.forEach((review, index) => {
            if (facultyResults[index]) {
              facultyMap[review.facultyid] = facultyResults[index];
            }
          });
          
          setFacultyData(facultyMap);
        }
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Helper function to format timestamp
  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="dark:bg-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <Card className="dark:bg-slate-800 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="font-medium">Error loading recent activity</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMaterials = activities?.materials && activities.materials.length > 0;
  const hasReviews = activities?.reviews && activities.reviews.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Recent Activities
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Your latest contributions to the O.R.A.C.L.E community
        </p>
      </div>

      <div className="space-y-6">
        {/* Course Materials Section */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <FileText className="h-5 w-5" />
              Course Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasMaterials ? (
              <div className="space-y-4">
                {activities.materials.map((material) => (
                  <div 
                    key={material.materialid} 
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-950 hover:border-blue-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {material.coursecode}
                          </span>
                          <Badge className={getStatusColor(material.poststate)}>
                            {material.poststate}
                          </Badge>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {material.postdescription}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(material.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {material.semester}
                          </div>
                        </div>
                      </div>
                      <a 
                        href={material.materialurl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No activities found here...</p>
                <p className="text-sm">Start posting some course materials!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card className=" bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-5 w-5" />
              Faculty Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasReviews ? (
              <div className="space-y-4 ">
                {activities.reviews.map((review) => (
                  <div 
                    key={review.reviewid} 
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-950 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Faculty Information - Main Heading */}
                        {facultyData[review.facultyid] && (
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {facultyData[review.facultyid].initials?.join('/') || 'N/A'} - {facultyData[review.facultyid].facultyname}
                            </span>
                            <Badge className={getStatusColor(review.poststate)}>
                              {review.poststate}
                            </Badge>
                            {review.isanon && (
                              <Badge variant="outline" className="text-xs">
                                Anonymous
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Course and Section - Subheading */}
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {review.coursecode} - Section {review.section}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {review.reviewdescription}
                        </p>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Teaching: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {review.teachingrating}/10
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Behavior: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {review.behaviourrating}/10
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Marking: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {review.markingrating}/10
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(review.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {review.semester}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No activities found here...</p>
                <p className="text-sm">Start posting some faculty reviews!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
