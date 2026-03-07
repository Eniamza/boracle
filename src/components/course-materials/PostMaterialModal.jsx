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
import { Plus, Loader2, Upload, FileText, X } from "lucide-react";
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
    const [semester, setSemester] = useState(globalInfo.semester);
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');

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

        // 50MB limit
        if (selected.size > 50 * 1024 * 1024) {
            toast.error('File size must be under 50MB');
            e.target.value = '';
            return;
        }

        setFile(selected);
    };

    const handleSubmit = async () => {
        if (!courseCode || !semester || !description || !file) {
            toast.error('Please fill all fields and select a file');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseCode', courseCode);
            formData.append('semester', semester);
            formData.append('postDescription', description);

            const res = await fetch('/api/materials', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast.success('Material posted successfully!');
                setOpen(false);
                resetForm();
                onMaterialPosted?.();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to post material');
            }
        } catch (e) {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setCourseCode('');
        setSemester(globalInfo.semester);
        setDescription('');
        setFile(null);
        setCourseSearch('');
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
                        <input
                            type="text"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="e.g. SPRING2026"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the material (e.g. Midterm notes, Final slide deck, Lab report...)"
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File</label>
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
                                <span className="text-xs text-gray-400">Max 50MB</span>
                                <input
                                    type="file"
                                    accept=".pdf,.pptx,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
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
                        disabled={submitting || !courseCode || !semester || !description || !file}
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
