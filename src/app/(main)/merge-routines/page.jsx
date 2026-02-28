"use client";

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardMergeRoutinesPage from '@/app/(dashboard)/dashboard/merge-routines/page';

export default function PublicMergeRoutinesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/dashboard/merge-routines');
        }
    }, [status, router]);

    if (status === 'loading' || status === 'authenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
            <Suspense>
                <DashboardMergeRoutinesPage />
            </Suspense>
        </div>
    );
}
