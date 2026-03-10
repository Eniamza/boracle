'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Upload, FileText, X, ChevronDown } from "lucide-react";
import { toast } from 'sonner';
import globalInfo from '@/constants/globalInfo';

const CONNECT_CDN_URL = 'https://usis-cdn.eniamza.com/connect.json';

const PostMaterialModal = ({ onMaterialPosted }) => {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [courseCodes, setCourseCodes] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Form state
    const [courseCode, setCourseCode] = useState('');
    const [season, setSeason] = useState(globalInfo.semester?.replace(/\d+/g, '') || 'SPRING');
    const [year, setYear] = useState(globalInfo.semester?.replace(/\D+/g, '') || new Date().getFullYear().toString());
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');

    const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
    const [linkUrl, setLinkUrl] = useState('');
    const [linkType, setLinkType] = useState(null); // 'youtube', 'drive', or 'github'

    const MAX_DESC = 100;
    const SEASONS = ['SPRING', 'SUMMER', 'FALL'];
    const currentYear = new Date().getFullYear();
    const YEARS = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => (currentYear - i).toString());

    useEffect(() => {
        if (open && courseCodes.length === 0) {
            fetchCourseCodes();
        }
    }, [open]);

    const fetchCourseCodes = async () => {
        setLoadingCourses(true);
        try {
            const res = await fetch(CONNECT_CDN_URL);
            const data = await res.json();
            // Extract unique course codes
            const codes = [...new Set(data.map(c => c.courseCode))].sort();
            setCourseCodes(codes);
        } catch (e) {
            toast.error('Failed to load course codes');
        } finally {
            setLoadingCourses(false);
        }
    };

    const filteredCodes = courseSearch
        ? courseCodes.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase()))
        : courseCodes;

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        const ext = selected.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'pptx', 'doc', 'docx'].includes(ext)) {
            toast.error('Only PDF, PPTX, DOC, and DOCX files are allowed');
            e.target.value = '';
            return;
        }

        // 25MB limit
        if (selected.size > 25 * 1024 * 1024) {
            toast.error('File size must be under 25MB');
            e.target.value = '';
            return;
        }

        setFile(selected);
    };

    const handleSubmit = async () => {
        if (!courseCode || !season || !year || !description) {
            toast.error('Please fill all required fields');
            return;
        }

        if (uploadType === 'file' && !file) {
            toast.error('Please select a file');
            return;
        }

        if (uploadType === 'link') {
            if (!linkUrl || !linkType) {
                toast.error('Please enter a valid YouTube, Google Drive, or GitHub link');
                return;
            }

            let isValidUrl = false;

            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?(.*&)?v=|playlist\?(.*&)?list=)|youtu\.be\/)[a-zA-Z0-9_-]+/;
            const driveRegex = /^(https?:\/\/)?(www\.)?(drive\.google\.com\/(file\/d\/|drive\/folders\/)|docs\.google\.com\/(document|spreadsheets|presentation)\/d\/)[a-zA-Z0-9_-]+/;
            const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/;

            if (linkType === 'youtube') {
                isValidUrl = ytRegex.test(linkUrl);
            } else if (linkType === 'drive') {
                isValidUrl = driveRegex.test(linkUrl);
            } else if (linkType === 'github') {
                isValidUrl = githubRegex.test(linkUrl);
            }

            if (!isValidUrl) {
                const typeLabels = { youtube: 'YouTube video/playlist', drive: 'Google Drive file/folder', github: 'GitHub repository' };
                toast.error(`Please enter a valid ${typeLabels[linkType] || 'supported'} link`);
                return;
            }
        }

        if (description.length > MAX_DESC) {
            toast.error(`Description must be ${MAX_DESC} characters or less`);
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();

            if (uploadType === 'file') {
                // Step 1: Get an upload URL from the server (small JSON request)
                const presignRes = await fetch('/api/materials/presign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        courseCode,
                    }),
                });

                if (!presignRes.ok) {
                    toast.error('Failed to prepare upload');
                    return;
                }

                const { uploadUrl, publicUrl, uploadToken, fileUuid, extension, contentType } = await presignRes.json();

                // Step 2: Upload file to R2 via the Cloudflare Worker proxy
                let uploadRes;
                try {
                    uploadRes = await fetch(uploadUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': contentType,
                            'X-Upload-Token': uploadToken,
                        },
                        body: file,
                    });
                } catch (uploadErr) {
                    console.error('[Upload] PUT failed:', uploadErr.message);
                    toast.error('File upload failed – please try again.');
                    return;
                }

                if (!uploadRes.ok) {
                    const errBody = await uploadRes.json().catch(() => ({}));
                    console.error('[Upload] Worker returned', uploadRes.status, errBody);
                    toast.error(errBody.error || `File upload failed (${uploadRes.status})`);
                    return;
                }

                // Step 3: Send only metadata to our API (no file in body)
                formData.append('fileUuid', fileUuid);
                formData.append('fileExtension', extension);
                formData.append('publicUrl', publicUrl);
            } else {
                formData.append('link', linkUrl);
                formData.append('linkType', linkType);
            }
            formData.append('courseCode', courseCode);
            formData.append('semester', `${season}${year}`);
            formData.append('postDescription', description);

            const res = await fetch('/api/materials', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast.success('Material posted for review!');
                setOpen(false);
                resetForm();
                onMaterialPosted?.();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to post material');
            }
        } catch (e) {
            console.error('Material submission error:', e);
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setCourseCode('');
        setSeason(globalInfo.semester?.replace(/\d+/g, '') || 'SPRING');
        setYear(globalInfo.semester?.replace(/\D+/g, '') || currentYear.toString());
        setDescription('');
        setFile(null);
        setCourseSearch('');
        setUploadType('file');
        setLinkUrl('');
        setLinkType(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <div className="flex items-center justify-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer px-3 py-2.5 md:px-4 md:py-2" title="Post Material">
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden md:inline">Post Material</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:w-full bg-white dark:bg-[#0f172a] border-gray-200 dark:border-blue-800/50 p-0 shadow-xl flex flex-col top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%] max-h-[85vh] gap-0">
                <DialogHeader className="p-4 border-b border-gray-200 dark:border-blue-800/50 shrink-0 text-left">
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white pr-6">Post Course Material</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
                    {/* Course Code Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course Code</label>
                        {loadingCourses ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading courses...
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search course code..."
                                    value={courseCode || courseSearch}
                                    onChange={(e) => {
                                        setCourseSearch(e.target.value);
                                        setCourseCode('');
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                {courseSearch && !courseCode && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                                        {filteredCodes.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-500">No courses found</div>
                                        ) : (
                                            filteredCodes.slice(0, 30).map(code => (
                                                <button
                                                    key={code}
                                                    onClick={() => { setCourseCode(code); setCourseSearch(''); }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                >
                                                    {code}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Semester */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Semester</label>
                        <div className="flex gap-3">
                            {/* Season tags */}
                            <div className="flex gap-1.5 flex-1">
                                {SEASONS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSeason(s)}
                                        className={`flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-colors border ${season === s
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                            }`}
                                    >
                                        {s.charAt(0) + s.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                            {/* Year dropdown */}
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <span className={`text-xs font-medium ${description.length > MAX_DESC ? 'text-red-500' : description.length > MAX_DESC - 10 ? 'text-amber-500' : 'text-gray-400'}`}>
                                {MAX_DESC - description.length} left
                            </span>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => {
                                if (e.target.value.length <= MAX_DESC) {
                                    setDescription(e.target.value);
                                }
                            }}
                            placeholder="e.g. Midterm notes, Final slides..."
                            rows={2}
                            maxLength={MAX_DESC}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    {/* File / Link Content Type Selection */}
                    <div>
                        <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setUploadType('file')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadType === 'file' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            >
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadType('link')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadType === 'link' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            >
                                Add Link
                            </button>
                        </div>

                        {uploadType === 'file' ? (
                            <div>
                                {file ? (
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-500/10">
                                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span className="text-sm text-blue-700 dark:text-blue-300 truncate flex-1">{file.name}</span>
                                        <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/30">
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload PDF, PPTX, DOC, or DOCX</span>
                                        <span className="text-xs text-gray-400">Max 25MB</span>
                                        <input
                                            type="file"
                                            accept=".pdf,.pptx,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="url"
                                    placeholder="Paste YouTube, Google Drive, or GitHub link..."
                                    value={linkUrl}
                                    onChange={(e) => {
                                        const url = e.target.value;
                                        setLinkUrl(url);
                                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                            setLinkType('youtube');
                                        } else if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                                            setLinkType('drive');
                                        } else if (url.includes('github.com')) {
                                            setLinkType('github');
                                        } else {
                                            setLinkType(null);
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-400"
                                />
                                {linkType === 'youtube' && (
                                    <div className="text-xs text-red-500 flex items-center gap-1 font-medium">YouTube Video Detected</div>
                                )}
                                {linkType === 'drive' && (
                                    <div className="text-xs text-blue-500 flex flex-col gap-1">
                                        <span className="font-semibold">Google Drive Link Detected</span>
                                        <span className="text-gray-500 dark:text-gray-400">Note: Make a copy of the drive folder in your own account if it was shared by your faculty. Otherwise they often get removed. Make sure the shared link is set to "Anyone with the link can view".</span>
                                    </div>
                                )}
                                {linkType === 'github' && (
                                    <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 font-medium">GitHub Repository Detected</div>
                                )}
                                {linkUrl && !linkType && (
                                    <div className="text-xs text-amber-500 font-medium">Only YouTube, Google Drive, and GitHub links are supported.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-blue-800/50 bg-gray-50 dark:bg-[#0c1629] shrink-0 rounded-b-lg">
                    <Button
                        onClick={() => { setOpen(false); resetForm(); }}
                        variant="outline"
                        className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 h-[42px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !courseCode || !season || !year || !description || description.length > MAX_DESC || (uploadType === 'file' ? !file : (!linkUrl || !linkType))}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white transition-colors h-[42px]"
                    >
                        {submitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                            <><Upload className="mr-2 h-4 w-4" /> Post Material</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PostMaterialModal;
