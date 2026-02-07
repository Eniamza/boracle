'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Trash2, 
  ArrowLeftRight, 
  Mail, 
  Shield, 
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SessionProvider, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const AdminSwapsPageContent = () => {
  const { data: session, status } = useSession();
  const [swaps, setSwaps] = useState([]);
  const [filteredSwaps, setFilteredSwaps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [swapToDelete, setSwapToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    if (status === 'authenticated' && session?.user?.userrole === 'admin') {
      fetchSwaps();
    } else if (status === 'authenticated' && session?.user?.userrole !== 'admin') {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    filterSwaps();
  }, [searchQuery, swaps]);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/swap');
      
      if (response.status === 401) {
        toast.error('Unauthorized: Admin access required');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setSwaps(data || []);
        setFilteredSwaps(data || []);
      } else {
        toast.error('Failed to fetch swaps');
      }
    } catch (error) {
      console.error('Error fetching swaps:', error);
      toast.error('Error loading swaps');
      setSwaps([]);
      setFilteredSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSwaps = () => {
    if (!searchQuery.trim()) {
      setFilteredSwaps(swaps);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = swaps.filter(swap => {
      const offeringCourse = getCourseInfo(swap.getSectionId);
      const userEmail = swap.uEmail?.toLowerCase() || '';
      const courseCode = offeringCourse?.courseCode?.toLowerCase() || '';
      const sectionName = offeringCourse?.sectionName?.toLowerCase() || '';
      
      return userEmail.includes(query) || 
             courseCode.includes(query) || 
             sectionName.includes(query) ||
             swap.swapId?.includes(query);
    });
    setFilteredSwaps(filtered);
  };

  const getCourseInfo = (sectionId) => {
    return courses.find(course => course.sectionid === sectionId) || null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (swap) => {
    setSwapToDelete(swap);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!swapToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/swap/${swapToDelete.swapId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Swap deleted successfully');
        // Remove the deleted swap from the local state
        setSwaps(swaps.filter(s => s.swapId !== swapToDelete.swapId));
        setFilteredSwaps(filteredSwaps.filter(s => s.swapId !== swapToDelete.swapId));
      } else {
        toast.error(data.error || 'Failed to delete swap');
      }
    } catch (error) {
      console.error('Error deleting swap:', error);
      toast.error('Error deleting swap');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSwapToDelete(null);
    }
  };

  // Check if user is not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.userrole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <ArrowLeftRight className="h-10 w-10" />
              Manage All Swaps
            </h1>
            <p className="text-gray-400 mt-2">
              Total active swaps: {swaps.length}
            </p>
          </div>
          
          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by email, course, or swap ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>
            <Button
              onClick={fetchSwaps}
              variant="outline"
              size="icon"
              className="bg-white dark:bg-gray-800"
            >
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
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
                {searchQuery ? 'No swaps found' : 'No active swaps'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? 'Try adjusting your search query' 
                  : 'Swaps will appear here when users create them'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSwaps.map((swap) => {
              const offeringCourse = getCourseInfo(swap.getSectionId);
              const askingCourses = swap.askingSections?.map(id => getCourseInfo(id)).filter(Boolean) || [];
              
              return (
                <Card key={swap.swapId} className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Swap Info Section */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={swap.isDone ? "success" : "secondary"}>
                                {swap.isDone ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                )}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {swap.swapId?.substring(0, 8)}...
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {swap.uEmail}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              Created: {formatDate(swap.createdAt)}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleDeleteClick(swap)}
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete swap"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Course Exchange Info */}
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          {/* Offering */}
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">OFFERING</h4>
                            {offeringCourse ? (
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {offeringCourse.courseCode}-[{offeringCourse.sectionName}]
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {offeringCourse.courseName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Faculty: {offeringCourse.faculty}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-500">Section ID: {swap.getSectionId}</p>
                            )}
                          </div>

                          {/* Looking For */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">LOOKING FOR</h4>
                            {askingCourses.length > 0 ? (
                              <div className="space-y-2">
                                {askingCourses.map((course, idx) => (
                                  <div key={idx}>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {course.courseCode}-[{course.sectionName}]
                                    </p>
                                    {idx === 0 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Faculty: {course.faculty}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : swap.askingSections?.length > 0 ? (
                              <p className="text-gray-500">
                                Section IDs: {swap.askingSections.join(', ')}
                              </p>
                            ) : (
                              <p className="text-gray-500 italic">Any section of the same course</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Confirm Swap Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to delete this swap request?</p>
                {swapToDelete && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      Swap ID: {swapToDelete.swapId?.substring(0, 16)}...
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      User: {swapToDelete.uEmail}
                    </div>
                    {getCourseInfo(swapToDelete.getSectionId) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Offering: {getCourseInfo(swapToDelete.getSectionId)?.courseCode}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-red-600 dark:text-red-400 font-medium mt-3">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Swap'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AdminSwapsPage = () => {
  return (
    <SessionProvider>
      <AdminSwapsPageContent />
    </SessionProvider>
  );
};

export default AdminSwapsPage;