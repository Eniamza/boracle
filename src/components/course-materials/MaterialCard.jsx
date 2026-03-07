'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, Download, Share2, FileText, Presentation, ArrowBigUp, ArrowBigDown, Loader2, Eye, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';

const MaterialCard = ({ material, isPublic = false, onVote }) => {
    const [expanded, setExpanded] = useState(false);
    const [voteLoading, setVoteLoading] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);

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

    const FileIcon = material.fileExtension === 'pdf' ? FileText : Presentation;
    const fileLabel = material.fileExtension?.toUpperCase();

    return (
        <>
            <Card className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex">
                    {/* Vote column */}
                    <div className="flex flex-col items-center justify-start gap-0 px-2 pt-3 pb-2 bg-gray-50 dark:bg-gray-900/80 border-r border-gray-100 dark:border-gray-800 min-w-[48px]">
                        <button
                            onClick={() => handleVote(1)}
                            disabled={isPublic || voteLoading === 'up'}
                            className={`p-1 rounded-md transition-colors ${material.userVote === 1
                                ? 'text-blue-500 bg-blue-100 dark:bg-blue-500/20'
                                : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                } ${isPublic ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isPublic ? 'Sign in to vote' : 'Upvote'}
                        >
                            {voteLoading === 'up' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowBigUp className={`w-5 h-5 ${material.userVote === 1 ? 'fill-current' : ''}`} />
                            )}
                        </button>
                        <span className={`text-sm font-bold tabular-nums ${material.voteCount > 0 ? 'text-blue-600 dark:text-blue-400' :
                            material.voteCount < 0 ? 'text-red-500' : 'text-gray-500'
                            }`}>
                            {material.voteCount}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            disabled={isPublic || voteLoading === 'down'}
                            className={`p-1 rounded-md transition-colors ${material.userVote === -1
                                ? 'text-red-500 bg-red-100 dark:bg-red-500/20'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                } ${isPublic ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isPublic ? 'Sign in to vote' : 'Downvote'}
                        >
                            {voteLoading === 'down' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowBigDown className={`w-5 h-5 ${material.userVote === -1 ? 'fill-current' : ''}`} />
                            )}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start">
                            <div className="flex-1 min-w-0">
                                {/* Poster info */}
                                <div className="flex items-center gap-1.5 mb-2">
                                    <User className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                        {material.posterName || 'Anonymous'}
                                    </span>
                                    {material.posterNetVotes !== undefined && material.posterNetVotes !== 0 && (
                                        <span className={`text-xs font-medium ${material.posterNetVotes > 0 ? 'text-blue-500' : 'text-red-400'}`}>
                                            · {material.posterNetVotes > 0 ? '+' : ''}{material.posterNetVotes} Aura
                                        </span>
                                    )}
                                </div>

                                {/* Header row */}
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold">
                                        {material.courseCode}
                                    </Badge>
                                    <Badge variant="outline" className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 shadow-none text-xs gap-1">
                                        <FileIcon className="w-3 h-3" />
                                        {fileLabel}
                                    </Badge>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">
                                        {material.semester}
                                    </span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1 font-medium">
                                        • {formatDate(material.createdAt)}
                                    </span>
                                </div>

                                {/* Description */}
                                <div>
                                    <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
                                        {material.postDescription}
                                    </p>
                                    {material.postDescription?.length > 100 && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1 flex items-center gap-0.5 font-medium"
                                        >
                                            {expanded ? (
                                                <><ChevronUp className="w-3 h-3" /> Show less</>
                                            ) : (
                                                <><ChevronDown className="w-3 h-3" /> Read more</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons (Stacked on right) */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-start gap-2 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                                <Button
                                    onClick={() => setViewerOpen(true)}
                                    size="sm"
                                    className="w-full sm:w-[110px] justify-center items-center gap-1.5 h-8 px-4 text-xs font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 !text-white transition-colors shadow-sm"
                                >
                                    <Eye className="w-3.5 h-3.5" /> View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full sm:w-[110px] justify-center items-center h-8 px-4 text-xs gap-1.5 bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-500 dark:border-green-500 text-white dark:text-white shadow-sm font-medium"
                                    onClick={handleDownload}
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full sm:w-[110px] justify-center h-8 px-3 text-xs gap-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={handleShare}
                                >
                                    <Share2 className="w-3.5 h-3.5" /> Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Document Viewer Dialog */}
            <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                <DialogContent showCloseButton={false} className="!max-w-[calc(100vw-100px)] w-[calc(100vw-100px)] h-[calc(100vh-100px)] p-0 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col gap-0">
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
        </>
    );
};

export default MaterialCard;
