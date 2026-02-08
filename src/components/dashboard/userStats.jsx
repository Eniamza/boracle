"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, FileText, ArrowLeftRight, ThumbsUp } from "lucide-react";

export default function UserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/userStatCount');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data.counts);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="dark:bg-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-24" />
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
      <div className="w-full max-w-4xl mx-auto px-4">
        <Card className="dark:bg-slate-800 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="font-medium">Error loading stats</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Reviews",
      value: stats?.reviews || 0,
      description: "Faculty Reviews Given",
      icon: MessageSquare,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Materials",
      value: stats?.materials || 0,
      description: "Course materials Shared",
      icon: FileText,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Swaps",
      value: stats?.swaps || 0,
      description: "Course swap Requests",
      icon: ArrowLeftRight,
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Votes",
      value: stats?.votes || 0,
      description: "Votes Casted",
      icon: ThumbsUp,
      color: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Your Stats
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <Card 
              key={index} 
              className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-white">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-blue-300 mb-1">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-gray-200 dark:text-gray-200">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
    </div>
  );
}
