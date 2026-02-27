"use client";

import { Suspense } from 'react';
import DashboardMergeRoutinesPage from '@/app/(dashboard)/dashboard/merge-routines/page';

export default function PublicMergeRoutinesPage() {
    return (
        <Suspense>
            <DashboardMergeRoutinesPage />
        </Suspense>
    );
}
