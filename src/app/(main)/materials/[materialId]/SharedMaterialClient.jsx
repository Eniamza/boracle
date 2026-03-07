'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import MaterialCard from '@/components/course-materials/MaterialCard';

export default function SharedMaterialClient({ material }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
            <div className="w-full max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shared Material</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{material.courseCode} · {material.semester}</p>
                    </div>
                </div>

                <MaterialCard material={material} isPublic={true} />

                {/* CTA */}
                <div className="mt-6 text-center">
                    <a
                        href="/course-materials"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                        <BookOpen className="w-4 h-4" />
                        Browse All Materials
                    </a>
                </div>
            </div>
        </div>
    );
}
