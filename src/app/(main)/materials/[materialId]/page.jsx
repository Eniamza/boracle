import React from 'react';
import { db, eq, sql } from '@/lib/db';
import { courseMaterials } from '@/lib/db/schema';
import { getPublicUrl } from '@/lib/r2';
import { notFound } from 'next/navigation';
import SharedMaterialClient from './SharedMaterialClient';

export async function generateMetadata({ params }) {
    const { materialId } = await params;

    const [material] = await db
        .select()
        .from(courseMaterials)
        .where(eq(courseMaterials.materialId, materialId));

    if (!material) {
        return {
            title: 'Material Not Found | Boracle',
            description: 'The material you are looking for does not exist.',
        };
    }

    const title = `${material.courseCode} — Course Material | Boracle`;
    const description = material.postDescription?.length > 150
        ? material.postDescription.slice(0, 150) + '...'
        : material.postDescription;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'B.O.R.A.C.L.E',
            url: `https://boracle.app/materials/${materialId}`,
        },
    };
}

export default async function SharedMaterialPage({ params }) {
    const { materialId } = await params;

    const [material] = await db
        .select()
        .from(courseMaterials)
        .where(eq(courseMaterials.materialId, materialId));

    if (!material) {
        notFound();
    }

    // Build a serialized material object for the client
    const materialData = {
        materialId: material.materialId,
        courseCode: material.courseCode,
        semester: material.semester,
        postDescription: material.postDescription,
        fileExtension: material.fileExtension,
        createdAt: material.createdAt,
        publicUrl: getPublicUrl(material.courseCode, material.fileUuid, material.fileExtension),
        voteCount: 0,
        userVote: null,
        isOwner: false,
    };

    return <SharedMaterialClient material={materialData} />;
}
