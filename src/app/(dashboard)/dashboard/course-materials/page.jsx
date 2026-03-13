'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, FileText, BookOpen, Search, X, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MaterialCard from '@/components/course-materials/MaterialCard';
import MobileMaterialCard from '@/components/course-materials/MobileMaterialCard';
import MaterialListTableView from '@/components/course-materials/MaterialListTableView';
import PostMaterialModal from '@/components/course-materials/PostMaterialModal';
import SignInPrompt from '@/components/shared/SignInPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';

const CourseMaterialsPage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    // Tab state: 'all' or 'my'
    const [activeTab, setActiveTab] = useState('all');
    // Sub-tab state for My Materials: 'accepted' or 'pending'
    const [mySubTab, setMySubTab] = useState('accepted');

    // View mode: 'grid' or 'list'
    const [viewMode, setViewMode] = useLocalStorage('boracle_material_view_mode', 'list');

    const isMobile = useIsMobile();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const debounceRef = useRef(null);
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const isFetchingRef = useRef(false);

    const isPublic = sessionStatus === 'unauthenticated';

    const [semesterSortOrder, setSemesterSortOrder] = useState(null); // 'asc', 'desc', null
    const [timeSortOrder, setTimeSortOrder] = useState('desc'); // 'asc', 'desc' (default is 'desc' based on typical feed APIs)

    // Debounce search input
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchQuery]);

    const fetchMaterials = useCallback(async (isLoadMore = false) => {
        if (isLoadMore && (!hasMore || isFetchingRef.current)) return;
        if (!isLoadMore && isFetchingRef.current) return;

        try {
            isFetchingRef.current = true;
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const params = new URLSearchParams();
            if (debouncedQuery) params.set('q', debouncedQuery);
            if (isLoadMore && nextCursor) params.set('cursor', nextCursor);

            if (activeTab === 'my') {
                params.set('isMyMaterials', 'true');
                params.set('stateFilter', mySubTab === 'accepted' ? 'published' : 'pending');
            }

            const res = await fetch(`/api/materials?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (isLoadMore) {
                    setMaterials(prev => {
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
            isFetchingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [debouncedQuery, nextCursor, hasMore, activeTab, mySubTab]);

    // Initial load and search/tab changes
    useEffect(() => {
        if (sessionStatus !== 'loading') {
            fetchMaterials(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus, debouncedQuery, activeTab, mySubTab]);

    // Infinite scroll observer
    useEffect(() => {
        const currentLoadMoreRef = loadMoreRef.current;
        if (!currentLoadMoreRef) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !isFetchingRef.current) {
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
    }, [fetchMaterials, hasMore, loading]);

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

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setMaterials([]);
        setNextCursor(null);
        setHasMore(true);
    };

    const handleSubTabChange = (subTab) => {
        if (subTab === mySubTab) return;
        setMySubTab(subTab);
        setMaterials([]);
        setNextCursor(null);
        setHasMore(true);
    };

    const renderEmptyState = () => {
        if (activeTab === 'my' && mySubTab === 'pending') {
            return (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        No pending materials
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        All your submissions have been reviewed!
                    </p>
                </div>
            );
        }
        if (activeTab === 'my') {
            return (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        No accepted materials yet
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Your approved materials will show up here.
                    </p>
                </div>
            );
        }
        return (
            <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {debouncedQuery ? 'No matching materials' : 'No materials yet'}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    {debouncedQuery ? 'Try a different search term' : 'Be the first to share study resources!'}
                </p>
            </div>
        );
    };

    return (
        <div className="w-full px-6 sm:px-[50px] py-6">
            {/* Header with Tabs + Post Button + Search */}
            <div className="sticky top-16 z-40 bg-white/90 dark:bg-[#020817]/90 backdrop-blur-md -mx-6 sm:-mx-[50px] -mt-6 px-6 sm:px-[50px] pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center justify-between mb-5 gap-3">
                    {/* Tabs */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 gap-0.5">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'all'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            All Materials
                        </button>
                        {session?.user?.email && (
                            <button
                                onClick={() => handleTabChange('my')}
                                className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'my'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                My Materials
                            </button>
                        )}
                    </div>

                    {/* View Toggle & Post button */}
                    <div className="flex items-center gap-2">
                        {/* View Toggle (Desktop Only) */}
                        <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 gap-0.5 mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'list'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

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
                </div>

                {/* Sub-tabs for My Materials */}
                {activeTab === 'my' && (
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => handleSubTabChange('accepted')}
                            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 border ${mySubTab === 'accepted'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700'
                                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Accepted
                        </button>
                        <button
                            onClick={() => handleSubTabChange('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 border ${mySubTab === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700'
                                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Pending
                        </button>
                    </div>
                )}

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by course code, description, or semester..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
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
            </div>

            {/* Materials list */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : materials.length === 0 ? (
                renderEmptyState()
            ) : (
                <>
                    {viewMode === 'list' && !isMobile ? (() => {
                        let sortedMaterials = [...materials];

                        if (semesterSortOrder) {
                            sortedMaterials.sort((a, b) => {
                                const termOrder = { 'SPRING': 1, 'SUMMER': 2, 'FALL': 3 };

                                // Helper to parse semester string like "FALL2025"
                                const parseSemester = (sem) => {
                                    if (!sem) return { year: 0, termNum: 0 };
                                    const match = sem.match(/^(SPRING|SUMMER|FALL)(\d{4})$/i);
                                    if (match) {
                                        return {
                                            termNum: termOrder[match[1].toUpperCase()],
                                            year: parseInt(match[2], 10)
                                        };
                                    }
                                    return { year: 0, termNum: 0 }; // Fallback
                                };

                                const aParsed = parseSemester(a.semester);
                                const bParsed = parseSemester(b.semester);

                                if (aParsed.year !== bParsed.year) {
                                    return semesterSortOrder === 'asc'
                                        ? aParsed.year - bParsed.year
                                        : bParsed.year - aParsed.year;
                                }

                                return semesterSortOrder === 'asc'
                                    ? aParsed.termNum - bParsed.termNum
                                    : bParsed.termNum - aParsed.termNum;
                            });
                        } else if (timeSortOrder) {
                            sortedMaterials.sort((a, b) => {
                                const dateA = new Date(a.createdAt).getTime();
                                const dateB = new Date(b.createdAt).getTime();
                                return timeSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                            });
                        }

                        return (
                            <MaterialListTableView
                                materials={sortedMaterials}
                                isPublic={isPublic}
                                onVote={handleVote}
                                semesterSortOrder={semesterSortOrder}
                                onSemesterSortChange={setSemesterSortOrder}
                                timeSortOrder={timeSortOrder}
                                onTimeSortChange={setTimeSortOrder}
                            />
                        );
                    })() : (
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
                    )}

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
