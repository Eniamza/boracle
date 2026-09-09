import React from 'react';
import ClientPage from './ClientPage';
import { getCachedRoutine } from '@/lib/api/routineFetcher';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const routine = await getCachedRoutine(id);

    if (!routine) {
        return {
            title: 'Routine Not Found',
            description: 'The routine you are looking for does not exist.',
        };
    }

    const title = routine.ownerName
        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Routine`
        : 'Shared Routine';

    const courseCount = routine.routineStr
        ? JSON.parse(atob(routine.routineStr)).length
        : 0;

    return {
        title,
        description: `Click to view or import ${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s routine with ${courseCount} course${courseCount !== 1 ? 's' : ''}`,
        openGraph: {
            title,
            description: `Click to view or import ${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s routine with ${courseCount} course${courseCount !== 1 ? 's' : ''}`,
            type: 'website',
        },
    };
}

export default async function Page({ params }) {
    const { id } = await params;
    const routine = await getCachedRoutine(id);

    // Normalize to match the shape ClientPage expects from /api/routine/[id]
    const initialRoutine = routine
        ? {
            id: routine.routineId,
            routineStr: routine.routineStr,
            email: "Anonymous",
            createdAt: routine.createdAt,
            semester: routine.semester,
            ownerName: routine.ownerName,
        }
        : null;

    return <ClientPage initialRoutine={initialRoutine} />;
}
