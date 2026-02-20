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

    if (!routine) {
        // Optional: Could let ClientPage handle the "not found" state, but Server can also 404 fast.
        // We'll pass it down like normal or throw notFound()
        // Here we just let the client handle it exactly as before to avoid layout jumps
    }

    return <ClientPage />;
}
