'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, FileText, BookOpen, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MaterialCard from '@/components/course-materials/MaterialCard';
import MobileMaterialCard from '@/components/course-materials/MobileMaterialCard';
import PostMaterialModal from '@/components/course-materials/PostMaterialModal';
import SignInPrompt from '@/components/shared/SignInPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const CourseMaterialsPage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [showMyMaterialsOnly, setShowMyMaterialsOnly] = useState(false);

    const isMobile = useIsMobile();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const debounceRef = useRef(null);
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);

    const isPublic = sessionStatus === 'unauthenticated';

    // Debounce search input
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchQuery]);

    const fetchMaterials = useCallback(async (isLoadMore = false) => {
        if (isLoadMore && (!hasMore || loadingMore)) return;

        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const params = new URLSearchParams();
            if (debouncedQuery) params.set('q', debouncedQuery);
            if (isLoadMore && nextCursor) params.set('cursor', nextCursor);
            if (showMyMaterialsOnly) params.set('isMyMaterials', 'true');

            const res = await fetch(`/api/materials?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (isLoadMore) {
                    setMaterials(prev => {
                        // Avoid duplicates if React strict mode double-fires
                        const existingIds = new Set(prev.map(m => m.materialId));
                        const newItems = data.items.filter(m => !existingIds.has(m.materialId));
                        return [...prev, ...newItems];
                    });
                } else {
                    setMaterials(data.items);
                }
                setNextCursor(data.nextCursor);
                setHasMore(!!data.nextCursor);
            }
        } catch (e) {
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [debouncedQuery, nextCursor, hasMore, loadingMore]);

    // Initial load and search changes
    useEffect(() => {
        if (sessionStatus !== 'loading') {
            fetchMaterials(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus, debouncedQuery, showMyMaterialsOnly]);

    // Infinite scroll observer
    useEffect(() => {
        const currentLoadMoreRef = loadMoreRef.current;
        if (!currentLoadMoreRef) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    fetchMaterials(true);
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(currentLoadMoreRef);

        return () => {
            if (observerRef.current && currentLoadMoreRef) {
                observerRef.current.unobserve(currentLoadMoreRef);
            }
        };
    }, [hasMore, loading, loadingMore, fetchMaterials]);

    const handleVote = (materialId, newValue) => {
        setMaterials(prev => prev.map(m => {
            if (m.materialId !== materialId) return m;
            const oldVote = m.userVote;
            let countDelta = 0;

            if (newValue === null) {
                countDelta = -(oldVote || 0);
            } else if (oldVote) {
                countDelta = newValue - oldVote;
            } else {
                countDelta = newValue;
            }

            return {
                ...m,
                userVote: newValue,
                voteCount: m.voteCount + countDelta,
            };
        }));
    };

    const handleMyMaterialsToggle = () => {
        setShowMyMaterialsOnly(!showMyMaterialsOnly);
        setNextCursor(null);
        setHasMore(true);
    };

    return (
        <div className="w-full px-6 sm:px-[50px] py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center">
                    {session?.user?.email && (
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 px-3 py-2 rounded-lg">
                            <span className="text-xs md:text-sm font-medium text-blue-700 dark:text-gray-300 whitespace-nowrap">My Materials</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={showMyMaterialsOnly}
                                onClick={handleMyMaterialsToggle}
                                className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 ${showMyMaterialsOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className="sr-only">Toggle my materials only</span>
                                <span
                                    className={`${showMyMaterialsOnly ? 'translate-x-[20px]' : 'translate-x-[2px]'
                                        } pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out`}
                                />
                            </button>
                        </label>
                    )}
                </div>

                {/* Post button */}
                {session ? (
                    <PostMaterialModal onMaterialPosted={() => fetchMaterials(false)} />
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

            {/* Search bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by course code, description, or semester..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

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
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        {debouncedQuery ? 'No matching materials' : 'No materials yet'}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        {debouncedQuery ? 'Try a different search term' : 'Be the first to share study resources!'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {materials.map(material => (
                            isMobile ? (
                                <MobileMaterialCard
                                    key={material.materialId}
                                    material={material}
                                    isPublic={isPublic}
                                    onVote={handleVote}
                                />
                            ) : (
                                <MaterialCard
                                    key={material.materialId}
                                    material={material}
                                    isPublic={isPublic}
                                    onVote={handleVote}
                                />
                            )
                        ))}
                    </div>

                    {/* Intersection Observer Target */}
                    <div ref={loadMoreRef} className="py-4 mt-4 flex justify-center w-full">
                        {loadingMore && <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />}
                        {!hasMore && materials.length > 5 && (
                            <span className="text-sm text-gray-400">You've reached the end</span>
                        )}
                    </div>
                </>
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
