"use client";

import React, { useState } from 'react';
import { changelog } from '@/constants/changelog';
import { sprints } from '@/constants/sprints';

const CategorySection = ({ title, type, items }) => {
    const [isOpen, setIsOpen] = useState(type === 'new');

    if (!items || items.length === 0) return null;

    let badgeClass = '';

    if (type === 'new') {
        badgeClass = 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400';
    } else if (type === 'improved') {
        badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400';
    } else if (type === 'fixed') {
        badgeClass = 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400';
    }

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center text-left mb-2 group focus:outline-none transition-opacity hover:opacity-80"
            >
                <span className={`${badgeClass} text-xs font-bold mr-2 px-2.5 py-0.5 rounded-md uppercase tracking-wider`}>
                    {title}
                </span>
                <span className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                    <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {items.map((desc, i) => <li key={i}>{desc}</li>)}
                </ul>
            )}
        </div>
    );
};

export default function ChangelogPage() {
    const [activeTab, setActiveTab] = useState('changelog');

    return (
        <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl flex-1">
                <div className="mb-8 text-center pt-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Updates & Sprints</h1>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        Track the latest improvements, fixes, and sprint progress.
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setActiveTab('changelog')}
                            className={`px-5 py-2.5 text-sm font-medium rounded-l-lg border transition-colors ${activeTab === 'changelog'
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                : 'bg-white/90 text-gray-900 border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800/90 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700'
                                }`}
                        >
                            Changelog
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('sprints')}
                            className={`px-5 py-2.5 text-sm font-medium rounded-r-md border border-l-0 transition-colors ${activeTab === 'sprints'
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                : 'bg-white/90 text-gray-900 border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800/90 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700'
                                }`}
                        >
                            Sprints
                        </button>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 shadow-lg rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300">
                    {activeTab === 'changelog' && (
                        <div className="p-6 sm:p-8 animate-in fade-in duration-300">
                            {changelog.map((item, index) => (
                                <div key={index} className="mb-10 last:mb-0 border-b border-gray-100 dark:border-gray-800 pb-10 last:border-0 last:pb-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Version {item.version}
                                        </h2>
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                            {item.date}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <CategorySection title="NEW" type="new" items={item.changes.new} />
                                        <CategorySection title="IMPROVED" type="improved" items={item.changes.improved} />
                                        <CategorySection title="FIXED" type="fixed" items={item.changes.fixed} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'sprints' && (
                        <div className="p-6 sm:p-8 animate-in fade-in duration-300">
                            {sprints.map((item, index) => (
                                <div key={index} className="mb-10 last:mb-0 border-b border-gray-100 dark:border-gray-800 pb-10 last:border-0 last:pb-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {item.sprint}
                                        </h2>
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                            {item.date}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <CategorySection title="NEW" type="new" items={item.changes.new} />
                                        <CategorySection title="IMPROVED" type="improved" items={item.changes.improved} />
                                        <CategorySection title="FIXED" type="fixed" items={item.changes.fixed} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
