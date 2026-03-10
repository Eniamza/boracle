"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Calendar, ExternalLink, User, BookOpen, Clock } from "lucide-react";
import Link from 'next/link';

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
              Recent Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasMaterials ? (
              <div className="space-y-4">
                {activities.materials.map((material) => {
                  let badgeStyling = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
                  let displayType = material.fileExtension?.toUpperCase() || 'LINK';
                  if (material.fileExtension === 'pdf') {
                    badgeStyling = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
                  } else if (material.fileExtension === 'youtube') {
                    displayType = 'YouTube';
                    badgeStyling = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-500/30';
                  } else if (material.fileExtension === 'drive') {
                    displayType = 'Google Drive';
                    badgeStyling = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
                  }

                  return (
                    <Link
                      href={`/materials/${material.materialId}`}
                      key={material.materialId}
                      target="_blank"
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-950 hover:border-blue-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <BookOpen className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {material.courseCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${badgeStyling}`}>
                              {displayType}
                            </span>
                            {material.postState !== 'approved' && (
                              <Badge className={getStatusColor(material.postState)}>
                                {material.postState}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 text-sm md:text-base">
                            {material.postDescription}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap mt-2">
                            <div className="flex items-center gap-1 shrink-0">
                              <Calendar className="h-3 w-3" />
                              {formatDate(material.createdAt)}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {material.semester}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-1">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No recent materials...</p>
                <p className="text-sm">Be the first to post one!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
