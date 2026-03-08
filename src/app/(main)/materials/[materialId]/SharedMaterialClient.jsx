'use client';

import React, { useState } from 'react';
import { BookOpen, Download, FileText, Presentation, Share2, Calendar, GraduationCap, User, ArrowBigUp, ExternalLink, Youtube, Cloud, Trash2, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

export default function SharedMaterialClient({ material }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const canDelete = session?.user?.email === material.uEmail || ['admin', 'moderator'].includes(session?.user?.userrole?.toLowerCase());

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/materials/${material.materialId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Material deleted');
                router.push('/dashboard/course-materials');
            } else {
                toast.error('Failed to delete material');
            }
        } catch (e) {
            toast.error('Error deleting material');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = material.publicUrl;
        a.download = `${material.courseCode}-${material.materialId.slice(0, 8)}.${material.fileExtension}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
    };

    const handleShare = async () => {
        const url = window.location.href;
        const success = await copyToClipboard(url);
        if (success) toast.success('Link copied to clipboard!');
        else toast.error('Failed to copy link');
    };

    const getViewerUrl = () => {
        return `https://docs.google.com/gview?url=${encodeURIComponent(material.publicUrl)}&embedded=true`;
    };

    const isYoutube = material.fileExtension === 'youtube';
    const isDrive = material.fileExtension === 'drive';
    const isLink = isYoutube || isDrive;

    const getExternalUrl = () => {
        if (!isLink || !material.publicUrl) return material.publicUrl;
        if (material.publicUrl.includes('.r2.dev')) {
            return material.publicUrl;
        }
        return material.publicUrl;
    };

    const FileIcon = isYoutube ? Youtube : isDrive ? Cloud : (material.fileExtension === 'pdf' ? FileText : Presentation);
    const fileLabel = isYoutube ? 'YOUTUBE' : isDrive ? 'G DRIVE' : material.fileExtension?.toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-4 sm:p-8">
            {/* Header Card */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Shared Course Material
                                </h1>

                                {/* Poster info */}
                                <div className="flex items-center gap-2 mt-1.5">
                                    <User className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                        {material.posterName || 'Anonymous'}
                                    </span>
                                    {material.posterNetVotes !== undefined && material.posterNetVotes !== 0 && (
                                        <span className={`text-sm font-medium ${material.posterNetVotes > 0 ? 'text-blue-500' : 'text-red-400'}`}>
                                            · {material.posterNetVotes > 0 ? '+' : ''}{material.posterNetVotes} Aura
                                        </span>
                                    )}
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold">
                                        {material.courseCode}
                                    </Badge>
                                    <Badge variant="outline" className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 shadow-none text-xs gap-1">
                                        <FileIcon className="w-3 h-3" />
                                        {fileLabel}
                                    </Badge>
                                    <span className="inline-block bg-blue-100 dark:bg-blue-800/80 text-blue-700 dark:text-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded">
                                        {material.semester}
                                    </span>
                                </div>

                                {/* Date & votes */}
                                <div className="flex items-center gap-3 mt-1.5">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(material.createdAt)}
                                    </p>
                                    {material.voteCount > 0 && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                            <ArrowBigUp className="w-3 h-3" />
                                            {material.voteCount} upvote{material.voteCount !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-xl">
                                    {material.postDescription}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <button
                                onClick={handleShare}
                                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border border-blue-200/50 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50 dark:bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 shrink-0"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                            {canDelete && (
                                <button
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 shrink-0"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            )}
                            {!isLink ? (
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors text-white text-sm font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            ) : (
                                <button
                                    onClick={() => window.open(getExternalUrl(), '_blank')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white text-sm font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline Document Viewer */}
            {!isLink && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <iframe
                            src={getViewerUrl()}
                            className="w-full border-0"
                            style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                            title={`${material.courseCode} - ${material.postDescription}`}
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {isLink && (
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                        <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">External Link</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                        This material is hosted externally. Click the button below to open it in a new tab securely.
                    </p>
                    <button
                        onClick={() => window.open(getExternalUrl(), '_blank')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors text-white font-medium"
                    >
                        <ExternalLink className="w-5 h-5" />
                        Open {isYoutube ? 'YouTube Video' : 'Google Drive Resource'}
                    </button>
                </div>
            )}

            {/* CTA */}
            <div className="max-w-7xl mx-auto mt-4 text-center">
                <a
                    href="/course-materials"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <BookOpen className="w-4 h-4" />
                    Browse all course materials →
                </a>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white dark:bg-[#0f172a] border-gray-200 dark:border-blue-800/50" onCloseFromOutside={() => setDeleteDialogOpen(false)}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Delete Material</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this material? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-blue-200/50 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 dark:hover:text-gray-900 dark:border-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-[#DC143C] hover:bg-[#B01030] dark:bg-[#DC143C] dark:hover:bg-[#B01030] !text-white border-0"
                        >
                            {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
