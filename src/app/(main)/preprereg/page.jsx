"use client";

import { Suspense } from 'react';
import DashboardPrepreregPage from '@/app/(dashboard)/dashboard/preprereg/page';

export default function PublicPrepreregPage() {
    return (
        <Suspense>
            <DashboardPrepreregPage />
        </Suspense>
    );
}
