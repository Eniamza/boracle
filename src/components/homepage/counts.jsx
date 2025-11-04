'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Loader2 } from 'lucide-react';

export default function Stats() {
    const [stats, setStats] = useState({
        totalSwaps: 0,
        totalReviews: 0,
        totalMaterials: 0
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

    const StatCard = ({ title, value, isLoading }) => (
        <Card className="w-64 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 dark:text-blue-300">
            <CardHeader>
                <CardTitle className="text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                    <span className="text-4xl font-bold dark:text-blue-200">
                        {value.toLocaleString()}
                    </span>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <div className="flex flex-wrap justify-center gap-6">
                <StatCard 
                    title="Swaps Posted" 
                    value={stats.totalSwaps} 
                    isLoading={loading}
                />
                
                <StatCard 
                    title="Faculty Reviews" 
                    value={stats.totalReviews} 
                    isLoading={loading}
                />
                
                <StatCard 
                    title="Resources Submitted" 
                    value={stats.totalMaterials} 
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