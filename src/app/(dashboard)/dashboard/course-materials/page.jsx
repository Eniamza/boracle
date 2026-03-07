'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, FileText, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MaterialCard from '@/components/course-materials/MaterialCard';
import PostMaterialModal from '@/components/course-materials/PostMaterialModal';
import SignInPrompt from '@/components/shared/SignInPrompt';
import { toast } from 'sonner';

const CourseMaterialsPage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [filterCode, setFilterCode] = useState('');

    const isPublic = sessionStatus === 'unauthenticated';

    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterCode) params.set('courseCode', filterCode);

            const res = await fetch(`/api/materials${params.toString() ? `?${params}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setMaterials(data);
            }
        } catch (e) {
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    }, [filterCode]);

    useEffect(() => {
        if (sessionStatus !== 'loading') {
            fetchMaterials();
        }
    }, [sessionStatus, fetchMaterials]);

    const handleVote = (materialId, newValue) => {
        setMaterials(prev => prev.map(m => {
            if (m.materialId !== materialId) return m;
            const oldVote = m.userVote;
            let countDelta = 0;

            if (newValue === null) {
                // Removing vote
                countDelta = -(oldVote || 0);
            } else if (oldVote) {
                // Changing vote
                countDelta = newValue - oldVote;
            } else {
                // New vote
                countDelta = newValue;
            }

            return {
                ...m,
                userVote: newValue,
                voteCount: m.voteCount + countDelta,
            };
        }));
    };

    // Get unique course codes from loaded materials for filter
    const availableCodes = [...new Set(materials.map(m => m.courseCode))].sort();

    return (
        <div className="w-full px-6 sm:px-[50px] py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Course Materials</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Share and discover study resources</p>
                    </div>
                </div>

                {/* Post button */}
                {session ? (
                    <PostMaterialModal onMaterialPosted={fetchMaterials} />
                ) : (
                    <div
                        onClick={() => setShowSignInPrompt(true)}
                        className="flex items-center justify-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer px-3 py-2.5 md:px-4 md:py-2"
                        title="Post Material"
                    >
                        <FileText className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">Post Material</span>
                    </div>
                )}
            </div>

            {/* Filter */}
            {availableCodes.length > 1 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterCode('')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors shrink-0 ${!filterCode
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                            }`}
                    >
                        All
                    </button>
                    {availableCodes.map(code => (
                        <button
                            key={code}
                            onClick={() => setFilterCode(code === filterCode ? '' : code)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors shrink-0 ${filterCode === code
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                }`}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            )}

            {/* Materials list */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : materials.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No materials yet</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to share study resources!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {materials
                        .filter(m => !filterCode || m.courseCode === filterCode)
                        .map(material => (
                            <MaterialCard
                                key={material.materialId}
                                material={material}
                                isPublic={isPublic}
                                onVote={handleVote}
                            />
                        ))}
                </div>
            )}

            {/* Sign In Prompt */}
            <SignInPrompt
                open={showSignInPrompt}
                onOpenChange={setShowSignInPrompt}
                featureDescription="Sign in with your BRACU G-Suite account to post and vote on course materials."
            />
        </div>
    );
};

export default CourseMaterialsPage;
