'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ExternalLink, Github, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ContributorsPage = () => {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContributors = async () => {
            try {
                const response = await fetch('/api/contributors');
                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.error || 'Failed to fetch contributors';
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                // Sort contributors: Eniamza first, then by contributions
                const sortedData = [...data].sort((a, b) => {
                    // Check if 'Eniamza' exists (case-insensitive check)
                    const isAEniamza = a.login.toLowerCase() === 'eniamza';
                    const isBEniamza = b.login.toLowerCase() === 'eniamza';

                    if (isAEniamza) return -1; // A comes first
                    if (isBEniamza) return 1;  // B comes first

                    // Secondary sort: number of contributions (descending)
                    return b.contributions - a.contributions;
                });

                setContributors(sortedData);
            } catch (err) {
                console.error('Error fetching contributors:', err);
                setError('Failed to load contributors');
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-gray-600 dark:text-gray-400">Loading amazing people...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-950">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <Badge variant="outline" className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        The T.E.A.M
                    </Badge>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Contributors</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        The incredible minds behind B.O.R.A.C.L.E
                    </p>
                </div>

                {/* Contributors Grid */}
                <div className="flex flex-wrap justify-center gap-6">
                    {contributors.map((contributor) => {
                        const isMaintainer = contributor.login.toLowerCase() === 'eniamza';

                        return (
                            <a
                                key={contributor.id}
                                href={contributor.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block"
                            >
                                <Card className={`h-[280px] w-[220px] flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isMaintainer
                                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600'
                                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                                    }`}>
                                    <CardHeader className="text-center pb-2 w-full">
                                        <div className="mx-auto relative mb-2">
                                            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isMaintainer
                                                ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900/40 shadow-xl'
                                                : 'border-blue-200 dark:border-blue-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors'
                                                }`}>
                                                <img
                                                    src={contributor.avatar_url}
                                                    alt={contributor.login}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                            {isMaintainer && (
                                                <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg" title="Project Maintainer">
                                                    <Sparkles className="w-3 h-3 fill-current" />
                                                </span>
                                            )}
                                        </div>
                                        <CardTitle
                                            className={`transition-colors text-center px-2 w-full ${contributor.login.length > 15
                                                ? 'text-sm leading-tight line-clamp-2 break-words text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-300'
                                                : 'text-lg truncate text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-300'
                                                }`}
                                            title={contributor.login}
                                        >
                                            {contributor.login}
                                        </CardTitle>
                                        <CardDescription className="font-medium flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-300">
                                            {isMaintainer ? 'Maintainer' : 'Contributor'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-center pt-0 pb-4 w-full">
                                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-blue-600 dark:bg-blue-600 rounded-full text-xs font-semibold text-white group-hover:bg-blue-700 dark:group-hover:bg-blue-500 transition-colors">
                                            <Github className="w-3 h-3" />
                                            <span>{contributor.contributions}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        );
                    })}
                </div>

                {/* Contribution CTA */}
                <div className="text-center py-12 px-4">
                    <Card className="max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/50">
                        <CardContent className="p-8 sm:p-12 space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Want to be part of the <span className="text-blue-600 dark:text-blue-400">T.E.A.M?</span>
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                                    Head over to our repository to contribute! Whether it's opening a Pull Request, reporting a bug, or suggesting a feature, even the smallest contributions help make B.O.R.A.C.L.E better for everyone.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="https://github.com/Eniamza/boracle"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Github className="w-5 h-5" />
                                    <span>Star on GitHub</span>
                                </a>
                                <a
                                    href="https://github.com/Eniamza/boracle/issues/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm hover:shadow"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <span>Report an Issue</span>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContributorsPage;
