import React from 'react';
import { db, eq, sql } from '@/lib/db';
import { courseMaterials, userinfo } from '@/lib/db/schema';
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

    // Fetch material with poster info and vote counts
    const [result] = await db
        .select({
            materialId: courseMaterials.materialId,
            courseCode: courseMaterials.courseCode,
            semester: courseMaterials.semester,
            postDescription: courseMaterials.postDescription,
            fileUuid: courseMaterials.fileUuid,
            fileUrl: courseMaterials.fileUrl,
            fileExtension: courseMaterials.fileExtension,
            createdAt: courseMaterials.createdAt,
            uEmail: courseMaterials.uEmail,
            userName: userinfo.userName,
            voteCount: sql`COALESCE((
                SELECT SUM(v.value) FROM votes v
                INNER JOIN targets t ON t.uuid = v.targetuuid
                WHERE t.refid = ${courseMaterials.materialId} AND t.kind = 'material'
            ), 0)`.as('voteCount'),
            posterNetVotes: sql`COALESCE((
                SELECT SUM(v2.value) FROM votes v2
                INNER JOIN targets t2 ON t2.uuid = v2.targetuuid
                INNER JOIN coursematerials cm2 ON cm2.materialid = t2.refid
                WHERE t2.kind = 'material' AND cm2.uemail = ${courseMaterials.uEmail}
            ), 0)`.as('posterNetVotes'),
        })
        .from(courseMaterials)
        .leftJoin(userinfo, eq(userinfo.email, courseMaterials.uEmail))
        .where(eq(courseMaterials.materialId, materialId));

    if (!result) {
        notFound();
    }

    const materialData = {
        materialId: result.materialId,
        courseCode: result.courseCode,
        semester: result.semester,
        postDescription: result.postDescription,
        fileExtension: result.fileExtension,
        createdAt: result.createdAt,
        publicUrl: result.fileUrl || getPublicUrl(result.courseCode, result.fileUuid, result.fileExtension),
        voteCount: Number(result.voteCount),
        posterName: result.userName?.split(' ')[0] || 'Anonymous',
        posterNetVotes: Number(result.posterNetVotes),
        userVote: null,
        isOwner: false,
    };

    return <SharedMaterialClient material={materialData} />;
}
