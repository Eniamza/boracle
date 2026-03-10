'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search, Shield, Loader2, Calendar, CheckCircle, XCircle, FileText, Presentation, Youtube, Cloud, ArrowBigUp, Pencil, Save, X, BookOpen, ExternalLink, SortDesc, SortAsc, Trash2, Eye, Download, Github
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
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

// Memoized material card — manages its own inline edit state
// so typing doesn't re-render the entire list
const MaterialCardItem = React.memo(({ m, processing, onApprove, onReject, onSaveEdit, onPreview, formatDate, getFileIcon }) => {
    const isExternalLink = ['youtube', 'drive', 'github'].includes(m.fileExtension);
    const [editing, setEditing] = useState(false);
    const [editDesc, setEditDesc] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSaveEdit(m.materialId, editDesc);
        setSaving(false);
        setEditing(false);
    };

    return (
        <Card className="bg-white/5 dark:bg-gray-900/50 backdrop-blur border-white/10 shadow-xl hover:shadow-2xl transition-all">
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm py-1">
                                {m.courseCode}
                            </Badge>
                            <Badge className={`${m.postState === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'} text-xs py-1`}>
                                {m.postState === 'pending' ? 'Pending' : 'Published'}
                            </Badge>
                            <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 font-medium py-1 px-3 flex items-center gap-1.5 shadow-sm">
                                {getFileIcon(m.fileExtension)}
                                <span className="uppercase tracking-wider text-[10px]">{m.fileExtension === 'youtube' ? 'YOUTUBE' : m.fileExtension === 'drive' ? 'G DRIVE' : m.fileExtension === 'github' ? 'GITHUB' : m.fileExtension}</span>
                            </Badge>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{m.semester}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(m.createdAt)}
                            </span>
                        </div>

                        {/* Description section with inline edit */}
                        <div className="mt-4 mb-3">
                            {editing ? (
                                <div className="flex gap-2 w-full max-w-2xl">
                                    <Input
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value.slice(0, 100))}
                                        className="flex-1 bg-white dark:bg-gray-800"
                                        maxLength={100}
                                        placeholder="Edit description..."
                                        autoFocus
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={saving || processing}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditing(false)}
                                        className="shrink-0"
                                        disabled={saving}
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-start group">
                                    <p className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-snug max-w-3xl">
                                        "{m.postDescription}"
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-blue-500 transition-opacity"
                                        onClick={() => {
                                            setEditing(true);
                                            setEditDesc(m.postDescription);
                                        }}
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-lg border border-gray-100 dark:border-gray-800/50 w-fit">
                            <div className="flex items-center gap-1.5 font-medium">
                                <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] uppercase">
                                    {(m.userName || 'A').charAt(0)}
                                </span>
                                {m.uEmail}
                            </div>
                            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
                            <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                <ArrowBigUp className="w-4 h-4" />
                                {m.voteCount} Votes
                            </div>
                            {isExternalLink && m.fileUrl ? (
                                <>
                                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
                                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2">
                                        <ExternalLink className="w-3.5 h-3.5" /> Preview Link
                                    </a>
                                </>
                            ) : (
                                m.publicUrl && (
                                    <>
                                        <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
                                        <button
                                            onClick={() => onPreview(m)}
                                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Preview Document
                                        </button>
                                    </>
                                )
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6 min-w-[140px]">
                        {m.postState === 'pending' ? (
                            <>
                                <Button
                                    onClick={() => onApprove(m)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold shadow-sm"
                                >
                                    <CheckCircle className="h-4 w-4" /> Approve
                                </Button>
                                <Button
                                    onClick={() => onReject(m)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold shadow-sm"
                                >
                                    <XCircle className="h-4 w-4" /> Reject
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => onReject(m)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold shadow-sm"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

const AdminMaterialsPageContent = () => {
    const { data: session, status } = useSession();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [stateFilter, setStateFilter] = useState('pending');

    // Dialog & actions state
    const [actionItem, setActionItem] = useState(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerItem, setViewerItem] = useState(null);

    const debounceRef = useRef(null);

    const getViewerUrl = (publicUrl) => {
        return `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;
    };

    // Debounce search input
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    const isAuthorized = status === 'authenticated' && (session?.user?.userrole === 'admin' || session?.user?.userrole === 'moderator');

    useEffect(() => {
        if (isAuthorized) {
            fetchMaterials();
        } else if (status === 'authenticated') {
            setLoading(false);
        }
    }, [isAuthorized, sortOrder]);

    // Client-side filtering by search query and state
    const filteredMaterials = useMemo(() => {
        let result = materials;

        // Filter by state
        if (stateFilter) {
            result = result.filter(m => m.postState === stateFilter);
        }

        // Filter by search query
        if (debouncedQuery.trim()) {
            const query = debouncedQuery.toLowerCase();
            result = result.filter(m => {
                const uEmail = m.uEmail?.toLowerCase() || '';
                const courseCode = m.courseCode?.toLowerCase() || '';
                const desc = m.postDescription?.toLowerCase() || '';
                const userName = m.userName?.toLowerCase() || '';
                return uEmail.includes(query) || courseCode.includes(query) || desc.includes(query) || userName.includes(query);
            });
        }

        return result;
    }, [materials, stateFilter, debouncedQuery]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/materials/moderation?sort=${sortOrder}`);

            if (response.status === 401) {
                toast.error('Unauthorized: Moderator access required');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setMaterials(data.items || []);
            } else {
                toast.error('Failed to fetch materials');
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Error loading materials');
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        if (!actionItem) return;

        setProcessing(true);
        try {
            const response = await fetch(`/api/materials/moderation/${actionItem.materialId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionType, postDescription: actionItem.postDescription })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Material ${actionType}d successfully`);
                setMaterials(prev => prev.filter(m => m.materialId !== actionItem.materialId));
            } else {
                toast.error(data.error || `Failed to ${actionType} material`);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing material:`, error);
            toast.error(`Error processing action`);
        } finally {
            setProcessing(false);
            setRejectDialogOpen(false);
            setApproveDialogOpen(false);
            setActionItem(null);
        }
    };

    const handleSaveEdit = useCallback(async (mId, newDesc) => {
        try {
            const response = await fetch(`/api/materials/moderation/${mId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', postDescription: newDesc })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Description saved successfully');
                setMaterials(prev => prev.map(m => m.materialId === mId ? { ...m, postDescription: newDesc } : m));
            } else {
                toast.error(data.error || 'Failed to save description');
            }
        } catch (error) {
            console.error('Error saving description:', error);
            toast.error('Error saving description');
        }
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getFileIcon = (ext) => {
        if (ext === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
        if (ext === 'drive') return <Cloud className="w-4 h-4 text-blue-500" />;
        if (ext === 'github') return <Github className="w-4 h-4 text-gray-800 dark:text-gray-200" />;
        if (ext === 'pdf') return <FileText className="w-4 h-4 text-orange-500" />;
        return <Presentation className="w-4 h-4 text-orange-500" />;
    };

    const handleApproveClick = useCallback((m) => {
        setActionItem(m);
        setApproveDialogOpen(true);
    }, []);

    const handleRejectClick = useCallback((m) => {
        setActionItem(m);
        setRejectDialogOpen(true);
    }, []);

    const handlePreviewClick = useCallback((m) => {
        setViewerItem(m);
        setViewerOpen(true);
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    if (status === 'unauthenticated' || (session?.user?.userrole !== 'admin' && session?.user?.userrole !== 'moderator')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="bg-white/5 dark:bg-gray-900/50 backdrop-blur border-white/10 shadow-xl max-w-md w-full">
                    <CardContent className="text-center py-12">
                        <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <Shield className="h-12 w-12 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
                        <p className="text-gray-600 dark:text-gray-400">You need moderator privileges to access this page.</p>
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
                            <BookOpen className="h-10 w-10" />
                            Moderate Materials
                        </h1>
                        <p className="text-gray-400 mt-2">Found materials: {materials.length}</p>
                    </div>

                    <div className="flex gap-3 items-center w-full md:w-auto">
                        <Button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            variant="outline"
                            className="bg-white dark:bg-gray-800 flex gap-2 w-full md:w-auto"
                        >
                            {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                            Sort Votes
                        </Button>
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search by email, course, desc..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            />
                        </div>
                        <Button onClick={fetchMaterials} variant="outline" size="icon" className="bg-white dark:bg-gray-800">
                            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* State filter buttons */}
                <div className="flex items-center gap-2 mb-6">
                    {[
                        { value: 'pending', label: 'Pending', activeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
                        { value: 'published', label: 'Published', activeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700' },
                        { value: '', label: 'All', activeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700' },
                    ].map(({ value, label, activeClass }) => (
                        <button
                            key={label}
                            onClick={() => setStateFilter(value)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                stateFilter === value
                                    ? activeClass
                                    : 'bg-transparent text-gray-400 border-gray-600 hover:bg-gray-800 hover:text-gray-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="text-sm text-gray-500 ml-2">
                        Showing {filteredMaterials.length} of {materials.length}
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-white" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading materials...</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <Card className="bg-white/5 dark:bg-gray-900/50 backdrop-blur border-white/10 shadow-xl">
                        <CardContent className="text-center py-16">
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {searchQuery ? 'No materials match search' : 'All caught up!'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery ? 'Try adjusting your search criteria.' : 'There are no materials to review.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredMaterials.map((m) => (
                            <MaterialCardItem
                                key={m.materialId}
                                m={m}
                                processing={processing}
                                onApprove={handleApproveClick}
                                onReject={handleRejectClick}
                                onSaveEdit={handleSaveEdit}
                                onPreview={handlePreviewClick}
                                formatDate={formatDate}
                                getFileIcon={getFileIcon}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Approval Dialog */}
            <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" /> Confirm Approval
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 mt-2">
                                <p>Are you sure you want to approve this material? It will become publicly visible immediately, and the uploader will receive an email notification.</p>
                                {actionItem && (
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Badge variant="outline">{actionItem.courseCode}</Badge>
                                            {actionItem.uEmail}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                                            "{actionItem.postDescription}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAction('approve')}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : 'Confirm Approve'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rejection Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" /> Confirm Rejection
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 mt-2">
                                <p>Are you sure you want to reject this material?</p>
                                <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-red-700/80 dark:text-red-400/80 font-medium">
                                    <li>The file will be permanently deleted from Cloudflare R2 servers.</li>
                                    <li>The uploader will receive an email notification.</li>
                                    <li>This action cannot be undone.</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAction('reject')}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : 'Delete & Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Document Viewer Dialog */}
            <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                <DialogContent showCloseButton={false} className="!max-w-[calc(100vw-32px)] w-[calc(100vw-32px)] h-[calc(100dvh-32px)] sm:!max-w-[calc(100vw-100px)] sm:w-[calc(100vw-100px)] sm:h-[calc(100vh-100px)] p-0 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col gap-0 rounded-xl">
                    {/* Viewer header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            {viewerItem && (
                                <>
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold shrink-0">
                                        {viewerItem.courseCode}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                        {viewerItem.postDescription}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            {viewerItem && (
                                <Button
                                    size="sm"
                                    className="h-7 px-3 text-xs gap-1.5 bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-500 !text-white shadow-sm"
                                    onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = viewerItem.publicUrl;
                                        a.download = `${viewerItem.courseCode}-${viewerItem.materialId.slice(0, 8)}.${viewerItem.fileExtension}`;
                                        a.target = '_blank';
                                        a.click();
                                    }}
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs gap-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 !text-white shadow-sm"
                                onClick={() => setViewerOpen(false)}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    {/* Iframe viewer */}
                    <div className="flex-1 relative">
                        {viewerItem && (
                            <iframe
                                src={getViewerUrl(viewerItem.publicUrl)}
                                className="w-full h-full border-0"
                                title={`${viewerItem.courseCode} - ${viewerItem.postDescription}`}
                                allowFullScreen
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function AdminMaterialsPage() {
    return (
        <SessionProvider>
            <AdminMaterialsPageContent />
        </SessionProvider>
    );
}
