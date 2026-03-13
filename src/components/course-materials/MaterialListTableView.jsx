'use client';

import React, { useState } from 'react';
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
import { ArrowBigUp, ArrowBigDown, Loader2, Eye, X, User, ExternalLink, Youtube, Cloud, Trash2, Github, FileText, Presentation, Download, Share2, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const MaterialListTableView = ({ 
    materials, 
    isPublic = false, 
    onVote, 
    onDelete,
    semesterSortOrder,
    onSemesterSortChange,
    timeSortOrder,
    onTimeSortChange
}) => {
    const { data: session } = useSession();
    
    // We need to manage active dialogs at the list level or within individual row components to avoid state shared across all rows.
    // However, it's easier to track a single selected material for viewing/deleting to avoid multiple overlapping dialogs.
    const [selectedForView, setSelectedForView] = useState(null);
    const [selectedForDelete, setSelectedForDelete] = useState(null);
    
    const [voteLoadingId, setVoteLoadingId] = useState(null);
    const [voteLoadingDirection, setVoteLoadingDirection] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sorting and Filtering states
    const [typeFilters, setTypeFilters] = useState([]); // array of fileExtensions
    const [showTypeFilterDropdown, setShowTypeFilterDropdown] = useState(false);

    const canDelete = (material) => material.isOwner || ['admin', 'moderator'].includes(session?.user?.userrole?.toLowerCase());

    const handleDelete = async () => {
        if (!selectedForDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/materials/${selectedForDelete.materialId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Material deleted');
                if (onDelete) {
                    onDelete(selectedForDelete.materialId);
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
            setSelectedForDelete(null);
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

    const handleVote = async (material, value) => {
        if (isPublic || voteLoadingId === material.materialId) return;

        setVoteLoadingId(material.materialId);
        setVoteLoadingDirection(value === 1 ? 'up' : 'down');
        
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
            setVoteLoadingId(null);
            setVoteLoadingDirection(null);
        }
    };

    const handleShare = async (material) => {
        const url = `${window.location.origin}/materials/${material.materialId}`;
        const success = await copyToClipboard(url);
        if (success) toast.success('Link copied to clipboard!');
        else toast.error('Failed to copy link');
    };

    const handleDownload = (material) => {
        const a = document.createElement('a');
        a.href = material.publicUrl;
        a.download = `${material.courseCode}-${material.materialId.slice(0, 8)}.${material.fileExtension}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
    };

    const getViewerUrl = (material) => {
        return `https://docs.google.com/gview?url=${encodeURIComponent(material?.publicUrl || '')}&embedded=true`;
    };

    const isLinkType = (fileExtension) => ['youtube', 'drive', 'github'].includes(fileExtension);
    
    const getExternalUrl = (material) => {
        const isLink = isLinkType(material.fileExtension);
        if (!isLink || !material.publicUrl) return material.publicUrl;
        return material.publicUrl;
    };

    const handleSemesterSortClick = () => {
        if (!onSemesterSortChange) return;
        if (semesterSortOrder === null || semesterSortOrder === 'none') onSemesterSortChange('asc');
        else if (semesterSortOrder === 'asc') onSemesterSortChange('desc');
        else onSemesterSortChange(null);
        
        // Reset time sort when semester sort is activated
        if (onTimeSortChange && (semesterSortOrder === null || semesterSortOrder === 'none')) {
            onTimeSortChange(null);
        }
    };

    const handleTimeSortClick = () => {
        if (!onTimeSortChange) return;
        if (timeSortOrder === null) onTimeSortChange('desc');
        else if (timeSortOrder === 'desc') onTimeSortChange('asc');
        else onTimeSortChange(null);
        
        // Reset semester sort when time sort is activated
        if (onSemesterSortChange && timeSortOrder === null) {
            onSemesterSortChange(null);
        }
    };

    const getFileIcon = (fileExtension) => {
        if (fileExtension === 'youtube') return Youtube;
        if (fileExtension === 'drive') return Cloud;
        if (fileExtension === 'github') return Github;
        if (fileExtension === 'pdf') return FileText;
        return Presentation;
    };

    const getFileLabel = (fileExtension) => {
        if (fileExtension === 'youtube') return 'YOUTUBE';
        if (fileExtension === 'drive') return 'G DRIVE';
        if (fileExtension === 'github') return 'GITHUB';
        return fileExtension?.toUpperCase();
    };

    const getFileBadgeClasses = (fileExtension) => {
        if (fileExtension === 'pdf') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
        if (fileExtension === 'drive') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
        if (fileExtension === 'youtube') return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-500/30';
        if (fileExtension === 'github') return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30';
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    };

    // Derived unique types for filter dropdown
    const availableTypes = [...new Set(materials.map(m => m.fileExtension))];

    const toggleTypeFilter = (ext) => {
        setTypeFilters(prev => 
            prev.includes(ext) 
                ? prev.filter(t => t !== ext) 
                : [...prev, ext]
        );
    };

    // Calculate Semester Sort Score
    const getSemesterSortScore = (semStr) => {
        if (!semStr) return 0;
        // Semester format e.g. "SPRING2026"
        const yearMatch = semStr.match(/\d+/);
        const seasonMatch = semStr.match(/[A-Z]+/i);
        
        let year = yearMatch ? parseInt(yearMatch[0]) : 0;
        let seasonScore = 0;
        if (seasonMatch) {
            const season = seasonMatch[0].toUpperCase();
            if (season === 'SPRING') seasonScore = 1;
            else if (season === 'SUMMER') seasonScore = 2;
            else if (season === 'FALL') seasonScore = 3;
        }
        return year * 10 + seasonScore; // e.g. 2026 * 10 + 1 = 20261 
    };

    // Apply filtering and sorting
    let processedMaterials = [...materials];
    
    if (typeFilters.length > 0) {
        processedMaterials = processedMaterials.filter(m => typeFilters.includes(m.fileExtension));
    }

    // We now handle sorting entirely in page.jsx except filtering by type
    if (typeFilters.length > 0) {
        processedMaterials = processedMaterials.filter(m => typeFilters.includes(m.fileExtension));
    }

    return (
        <>
            <div className="hidden md:block bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm w-full relative">
                <div className="overflow-x-auto">
                    <table className="text-left border-collapse table-fixed w-full min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[140px] whitespace-nowrap bg-transparent">Course</th>
                                
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[120px] relative bg-transparent">
                                <div className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowTypeFilterDropdown(!showTypeFilterDropdown); }}>
                                    <span>Type</span>
                                    <div className="flex items-center gap-1">
                                        {typeFilters.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                                                {typeFilters.length}
                                            </span>
                                        )}
                                        <Filter className={`w-3.5 h-3.5 transition-colors ${showTypeFilterDropdown || typeFilters.length > 0 ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    </div>
                                </div>
                                
                                {showTypeFilterDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowTypeFilterDropdown(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1" onClick={(e) => e.stopPropagation()}>
                                            {availableTypes.map(ext => {
                                                const Icon = getFileIcon(ext);
                                                return (
                                                    <label key={ext} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={typeFilters.includes(ext)}
                                                            onChange={() => toggleTypeFilter(ext)}
                                                            className="form-checkbox h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Badge className={`${getFileBadgeClasses(ext)} shadow-none text-[10px] gap-1 px-1.5 py-0.5 uppercase tracking-wider`}>
                                                            <Icon className="w-3 h-3" />
                                                            {getFileLabel(ext)}
                                                        </Badge>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </th>
                            
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[130px] whitespace-nowrap cursor-pointer group bg-transparent" onClick={handleSemesterSortClick}>
                                    <div className="flex items-center gap-1.5">
                                        <span>Semester</span>
                                        {semesterSortOrder === 'asc' ? (
                                            <ArrowUp className="w-3.5 h-3.5 transition-colors text-blue-500" />
                                        ) : semesterSortOrder === 'desc' ? (
                                            <ArrowDown className="w-3.5 h-3.5 transition-colors text-blue-500" />
                                        ) : (
                                            <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-gray-400 group-hover:text-gray-600" />
                                        )}
                                    </div>
                                </th>
                                
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[160px] bg-transparent">Uploader</th>
                                
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[130px] whitespace-nowrap cursor-pointer group bg-transparent" onClick={handleTimeSortClick}>
                                    <div className="flex items-center gap-1.5">
                                        <span>Time</span>
                                        {timeSortOrder === 'asc' ? (
                                            <ArrowUp className="w-3.5 h-3.5 transition-colors text-blue-500" />
                                        ) : timeSortOrder === 'desc' ? (
                                            <ArrowDown className="w-3.5 h-3.5 transition-colors text-blue-500" />
                                        ) : (
                                            <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-gray-400 group-hover:text-gray-600" />
                                        )}
                                    </div>
                                </th>
                                
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 bg-transparent">Description</th>
                                <th className="py-2.5 lg:py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 w-[160px] text-center whitespace-nowrap bg-transparent">Action</th>
                                <th className="py-2.5 lg:py-4 px-2 align-middle w-[60px] text-center bg-transparent">Vote</th>
                            </tr>
                        </thead>
                    <tbody className="text-sm">
                        {processedMaterials.map((material, index) => {
                            const Icon = getFileIcon(material.fileExtension);
                            const isLink = isLinkType(material.fileExtension);
                            
                            return (
                                <tr key={material.materialId} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/80 transition-colors group">
                                    {/* Column 1: Course Code */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap">
                                                {material.courseCode}
                                            </Badge>
                                            {material.postState === 'pending' && (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-none text-[10px] font-medium px-1.5 py-0.5">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Column 2: FileType */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700">
                                        <Badge className={`${getFileBadgeClasses(material.fileExtension)} shadow-none text-[10px] gap-1 px-1.5 py-0.5 uppercase tracking-wider`}>
                                            <Icon className="w-3 h-3" />
                                            {getFileLabel(material.fileExtension)}
                                        </Badge>
                                    </td>
                                    
                                    {/* Column 3: Semester & Year */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                        {material.semester}
                                    </td>
                                    
                                    {/* Column 4: Uploader */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 max-w-full">
                                            <div className="bg-purple-100 dark:bg-purple-500/10 p-1.5 rounded-full shrink-0">
                                                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="min-w-0 pr-2">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate pb-0.5">
                                                    {material.posterName || 'Anonymous'}
                                                </p>
                                                {material.posterNetVotes !== undefined && material.posterNetVotes !== 0 && (
                                                    <p className={`text-xs font-medium truncate ${material.posterNetVotes > 0 ? 'text-blue-500' : 'text-red-400'}`}>
                                                        {material.posterNetVotes > 0 ? '+' : ''}{material.posterNetVotes} Aura
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 5: Upload Time */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {formatDate(material.createdAt)}
                                    </td>

                                    {/* Column 6: Description */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="w-full">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                                                {material.postDescription}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Action */}
                                    <td className="py-4 px-4 align-middle border-r border-gray-200 dark:border-gray-700 text-center">
                                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {canDelete(material) && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 rounded-full text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => setSelectedForDelete(material)}
                                                    title="Delete Material"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-8 h-8 rounded-full text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                onClick={() => handleShare(material)}
                                                title="Share Link"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                            
                                            <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-1.5 ml-0.5">
                                                {!isLink && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="w-8 h-8 rounded-full text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                        onClick={() => handleDownload(material)}
                                                        title="Download Material"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => isLink ? window.open(getExternalUrl(material), '_blank') : setSelectedForView(material)}
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 !text-white"
                                                    title={isLink ? 'Open Link' : 'View Material'}
                                                >
                                                    {isLink ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Votes Column (Vertical) */}
                                    <td className="py-2 px-1 align-middle">
                                        <div className="flex flex-col items-center justify-center gap-0.5 w-10 mx-auto">
                                            <button
                                                onClick={() => !material.isOwner && handleVote(material, 1)}
                                                disabled={isPublic || voteLoadingId === material.materialId || material.isOwner}
                                                className={`p-1 rounded transition-colors ${material.userVote === 1
                                                    ? 'text-blue-500 bg-blue-100 dark:bg-blue-500/20'
                                                    : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    } ${(isPublic || material.isOwner) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                title={material.isOwner ? "You cannot vote on your own material" : "Upvote"}
                                            >
                                                {voteLoadingId === material.materialId && voteLoadingDirection === 'up' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowBigUp className={`w-5 h-5 ${material.userVote === 1 ? 'fill-current' : ''}`} />}
                                            </button>
                                            <span className={`text-xs font-bold leading-none ${material.voteCount > 0 ? 'text-blue-600 dark:text-blue-400' :
                                                material.voteCount < 0 ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                {material.voteCount}
                                            </span>
                                            <button
                                                onClick={() => !material.isOwner && handleVote(material, -1)}
                                                disabled={isPublic || voteLoadingId === material.materialId || material.isOwner}
                                                className={`p-1 rounded transition-colors ${material.userVote === -1
                                                    ? 'text-red-500 bg-red-100 dark:bg-red-500/20'
                                                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    } ${(isPublic || material.isOwner) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                title={material.isOwner ? "You cannot vote on your own material" : "Downvote"}
                                            >
                                                {voteLoadingId === material.materialId && voteLoadingDirection === 'down' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowBigDown className={`w-5 h-5 ${material.userVote === -1 ? 'fill-current' : ''}`} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Document Viewer Dialog (Shared) */}
            <Dialog open={!!selectedForView} onOpenChange={(open) => !open && setSelectedForView(null)}>
                <DialogContent showCloseButton={false} className="!max-w-[calc(100vw-100px)] w-[calc(100vw-100px)] h-[calc(100vh-100px)] p-0 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col gap-0">
                    {/* Viewer header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-none text-xs font-semibold shrink-0">
                                {selectedForView?.courseCode}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {selectedForView?.postDescription}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs gap-1.5 bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-500 !text-white shadow-sm"
                                onClick={() => handleDownload(selectedForView)}
                            >
                                <Download className="w-3.5 h-3.5" /> Download
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs gap-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 !text-white shadow-sm"
                                onClick={() => setSelectedForView(null)}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    {/* Iframe viewer */}
                    <div className="flex-1 relative">
                        {selectedForView && (
                            <iframe
                                src={getViewerUrl(selectedForView)}
                                className="w-full h-full border-0"
                                title={`${selectedForView.courseCode} - ${selectedForView.postDescription}`}
                                allowFullScreen
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog (Shared) */}
            <AlertDialog open={!!selectedForDelete} onOpenChange={(open) => !open && !isDeleting && setSelectedForDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-[#0f172a] border-gray-200 dark:border-blue-800/50" onCloseFromOutside={() => !isDeleting && setSelectedForDelete(null)}>
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

export default MaterialListTableView;
