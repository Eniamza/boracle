import React from 'react';
import ClientPage from './ClientPage';
import { getCachedMergedRoutine } from '@/lib/api/routineFetcher';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const routine = await getCachedMergedRoutine(id);

    if (!routine) {
        return {
            title: 'Merged Routine Not Found',
            description: 'The merged routine you are looking for does not exist.',
        };
    }

    const title = routine.ownerName
        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Merged Routine`
        : 'Shared Merged Routine';

    const routineData = routine.routineData
        ? JSON.parse(routine.routineData)
        : [];

    const friendsCount = routineData.length;

    // Count unique courses
    const allSectionIds = routineData.flatMap(item => item.sectionIds || []);
    const uniqueCourseCount = new Set(allSectionIds).size;

    return {
        title,
        description: `Click to view or import ${routine.ownerName}'s merged routine with ${uniqueCourseCount} course${uniqueCourseCount !== 1 ? 's' : ''} and ${friendsCount} friend${friendsCount !== 1 ? 's' : ''}`,
        openGraph: {
            title,
            description: `Click to view or import ${routine.ownerName}'s merged routine with ${uniqueCourseCount} course${uniqueCourseCount !== 1 ? 's' : ''} and ${friendsCount} friend${friendsCount !== 1 ? 's' : ''}`,
            type: 'website',
        },
    };
}

export default async function Page({ params }) {
    const { id } = await params;
    const routine = await getCachedMergedRoutine(id);

    if (!routine) {
        // Will be handled by the client page or we can return custom UI
    }

    return <ClientPage />;
}
