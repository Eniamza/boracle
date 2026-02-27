"use client";

import { Suspense } from 'react';
import DashboardCourseSwapPage from '@/app/(dashboard)/dashboard/courseswap/page';

export default function PublicCourseSwapPage() {
    return (
        <Suspense>
            <DashboardCourseSwapPage />
        </Suspense>
    );
}
