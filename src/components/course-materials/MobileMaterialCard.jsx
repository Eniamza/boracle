'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
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
import { ChevronUp, ChevronDown, Download, Share2, FileText, Presentation, ArrowBigUp, ArrowBigDown, Loader2, Eye, X, User, ExternalLink, Youtube, Cloud, Trash2, Github } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const MobileMaterialCard = ({ material, isPublic = false, onVote, onDelete }) => {
    const { data: session } = useSession();
    const [expanded, setExpanded] = useState(false);
    const [voteLoading, setVoteLoading] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const canDelete = session?.user?.email === material.uEmail || ['admin', 'moderator'].includes(session?.user?.userrole?.toLowerCase());

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/materials/${material.materialId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Material deleted');
                if (onDelete) {
                    onDelete(material.materialId);
                } else {
                    window.location.reload();
                }
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
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const handleVote = async (value) => {
        if (isPublic || voteLoading) return;

        setVoteLoading(value === 1 ? 'up' : 'down');
        try {
            if (material.userVote === value) {
                const res = await fetch(`/api/materials/${material.materialId}/vote`, { method: 'DELETE' });
                if (res.ok) onVote?.(material.materialId, null);
            } else {
                const res = await fetch(`/api/materials/${material.materialId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                });
                if (res.ok) onVote?.(material.materialId, value);
            }
        } catch (e) {
            toast.error('Failed to vote');
        } finally {
            setVoteLoading(null);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/materials/${material.materialId}`;
        const success = await copyToClipboard(url);
        if (success) toast.success('Link copied to clipboard!');
        else toast.error('Failed to copy link');
    };

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = material.publicUrl;
        a.download = `${material.courseCode}-${material.materialId.slice(0, 8)}.${material.fileExtension}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
    };

    const getViewerUrl = () => {
        // Google Docs Viewer supports pdf, pptx, doc, docx
        return `https://docs.google.com/gview?url=${encodeURIComponent(material.publicUrl)}&embedded=true`;
    };

    const isYoutube = material.fileExtension === 'youtube';
    const isDrive = material.fileExtension === 'drive';
    const isGithub = material.fileExtension === 'github';
    const isLink = isYoutube || isDrive || isGithub;

    const getExternalUrl = () => {
        if (!isLink || !material.publicUrl) return material.publicUrl;
        if (material.publicUrl.includes('.r2.dev')) {
            return material.publicUrl;
        }
        return material.publicUrl;
    };

    const FileIcon = isYoutube ? Youtube : isDrive ? Cloud : isGithub ? Github : (material.fileExtension === 'pdf' ? FileText : Presentation);
    const fileLabel = isYoutube ? 'YOUTUBE' : isDrive ? 'G DRIVE' : isGithub ? 'GITHUB' : material.fileExtension?.toUpperCase();

    const getFileBadgeClasses = () => {
        if (material.fileExtension === 'pdf') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
        if (isDrive) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
        if (isYoutube) return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-500/30';
        if (isGithub) return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30';
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    };

    return (
        <>
            <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-xl p-3.5 flex flex-col gap-3">
                {/* Top Row: User + Votes */}
                <div className="flex items-center justify-between gap-2">
                    {/* Poster info */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                            {material.posterName || 'Anonymous'}
                        </span>
                        {material.posterNetVotes !== undefined && material.posterNetVotes !== 0 && (
                            <span className={`text-[11px] font-medium shrink-0 ${material.posterNetVotes > 0 ? 'text-blue-500' : 'text-red-400'}`}>
                                · {material.posterNetVotes > 0 ? '+' : ''}{material.posterNetVotes} Aura
                            </span>
                        )}
                    </div>

                    {/* Compact Vote Controls */}
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/60 rounded-lg p-0.5 border border-gray-100 dark:border-gray-800 shrink-0">
                        <button
                            onClick={() => !material.isOwner && handleVote(1)}
                            disabled={isPublic || voteLoading === 'up' || material.isOwner}
                            className={`p-1 rounded transition-colors ${material.userVote === 1
                                ? 'text-blue-500 bg-blue-100 dark:bg-blue-500/20'
                                : 'text-gray-400 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                } ${(isPublic || material.isOwner) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={material.isOwner ? "You cannot vote on your own material" : "Upvote"}
                        >
                            {voteLoading === 'up' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowBigUp className={`w-4 h-4 ${material.userVote === 1 ? 'fill-current' : ''}`} />}
                        </button>
                        <span className={`text-xs font-bold w-4 text-center ${material.voteCount > 0 ? 'text-blue-600 dark:text-blue-400' :
                            material.voteCount < 0 ? 'text-red-500' : 'text-gray-500'
                            }`}>
                            {material.voteCount}
                        </span>
                        <button
                            onClick={() => !material.isOwner && handleVote(-1)}
                            disabled={isPublic || voteLoading === 'down' || material.isOwner}
                            className={`p-1 rounded transition-colors ${material.userVote === -1
                                ? 'text-red-500 bg-red-100 dark:bg-red-500/20'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                } ${(isPublic || material.isOwner) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={material.isOwner ? "You cannot vote on your own material" : "Downvote"}
                        >
                            {voteLoading === 'down' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowBigDown className={`w-4 h-4 ${material.userVote === -1 ? 'fill-current' : ''}`} />}
                        </button>
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {material.postState === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-none text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            Pending Approval
                        </Badge>
                    )}
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold px-2 py-0.5">
                        {material.courseCode}
                    </Badge>
                    <Badge className={`${getFileBadgeClasses()} shadow-none text-[10px] gap-1 px-1.5 py-0.5 uppercase`}>
                        <FileIcon className="w-3 h-3" />
                        {fileLabel}
                    </Badge>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1.5">
                        {material.semester}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-auto">
                        {formatDate(material.createdAt)}
                    </span>
                </div>

                {/* Description */}
                <div>
                    <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
                        {material.postDescription}
                    </p>
                    {material.postDescription?.length > 100 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1 flex items-center gap-0.5 font-medium"
                        >
                            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 mt-auto">
                    <Button
                        onClick={() => isLink ? window.open(getExternalUrl(), '_blank') : setViewerOpen(true)}
                        size="sm"
                        className="flex-1 h-8 text-xs font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 !text-white"
                    >
                        {isLink ? <ExternalLink className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />} {isLink ? 'Open' : 'View'}
                    </Button>
                    {!isLink && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-200 !text-white dark:!text-gray-900 border-transparent font-medium shadow-sm transition-colors"
                            onClick={handleDownload}
                        >
                            <Download className="w-3.5 h-3.5 mr-1" /> Save
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="flex-none h-8 px-2.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={handleShare}
                        title="Share Link"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    {canDelete && (
                        <Button
                            size="sm"
                            className="flex-none h-8 px-2.5 bg-red-600 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 !text-white shadow-sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={isDeleting}
                            title="Delete Material"
                        >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                    )}
                </div>
            </Card>

            {/* Document Viewer Dialog */}
            <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                <DialogContent showCloseButton={false} className="!max-w-[calc(100vw-32px)] w-[calc(100vw-32px)] h-[calc(100dvh-32px)] sm:!max-w-[calc(100vw-100px)] sm:w-[calc(100vw-100px)] sm:h-[calc(100vh-100px)] p-0 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col gap-0 rounded-xl">
                    {/* Viewer header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold shrink-0">
                                {material.courseCode}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {material.postDescription}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs gap-1.5 bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-500 !text-white shadow-sm"
                                onClick={handleDownload}
                            >
                                <Download className="w-3.5 h-3.5" /> Download
                            </Button>
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
                        <iframe
                            src={getViewerUrl()}
                            className="w-full h-full border-0"
                            title={`${material.courseCode} - ${material.postDescription}`}
                            allowFullScreen
                        />
                    </div>
                </DialogContent>
            </Dialog>

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
        </>
    );
};

export default MobileMaterialCard;
