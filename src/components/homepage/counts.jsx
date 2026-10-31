'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2 } from 'lucide-react';

function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);
    const prevTarget = useRef(0);

    useEffect(() => {
        if (target === 0 || target === prevTarget.current) return;
        prevTarget.current = target;

        const start = 0;
        const startTime = performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + (target - start) * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }, [target, duration]);

    return count;
}

export default function Stats() {
    const [stats, setStats] = useState({
        totalSwaps: 0,
        totalReviews: 0,
        totalMaterials: 0,
        totalUsers: 0,
        totalFaculties: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/home/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    throw new Error('Failed to fetch stats');
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, isLoading }) => {
        const animatedValue = useCountUp(isLoading ? 0 : Number(value));
        return (
            <Card className="w-64 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 dark:text-blue-300">
                <CardHeader>
                    <CardTitle className="text-center">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    ) : (
                        <span className="text-4xl font-bold dark:text-blue-200">
                            {animatedValue.toLocaleString()}
                        </span>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <div className="flex flex-wrap justify-center gap-6">
                <StatCard
                    title="Swaps Posted"
                    value={stats.totalSwaps}
                    isLoading={loading}
                />

                {/* <StatCard
                    title="Faculty Reviews"
                    value={stats.totalReviews}
                    isLoading={loading}
                /> */}

                <StatCard
                    title="Resources Submitted"
                    value={stats.totalMaterials}
                    isLoading={loading}
                />

                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    isLoading={loading}
                />

                <StatCard
                    title="Total Faculties Available"
                    value={stats.totalFaculties}
                    isLoading={loading}
                />
            </div>

            {error && (
                <div className="text-center mt-4 text-red-600 dark:text-red-400">
                    Error loading stats: {error}
                </div>
            )}
        </>
    );
}
