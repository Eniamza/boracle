// GET /api/materials/[materialId]/details — Public single material details
import { db, eq, sql } from '@/lib/db';
import { courseMaterials, targets, votes } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { getPublicUrl } from '@/lib/r2';

export async function GET(req, { params }) {
    try {
        const { materialId } = await params;

        const [material] = await db
            .select({
                materialId: courseMaterials.materialId,
                fileUuid: courseMaterials.fileUuid,
                fileExtension: courseMaterials.fileExtension,
                courseCode: courseMaterials.courseCode,
                semester: courseMaterials.semester,
                postDescription: courseMaterials.postDescription,
                postState: courseMaterials.postState,
                createdAt: courseMaterials.createdAt,
                voteCount: sql`COALESCE((
          SELECT SUM(v.value) FROM votes v
          INNER JOIN targets t ON t.uuid = v.targetuuid
          WHERE t.refid = ${courseMaterials.materialId} AND t.kind = 'material'
        ), 0)`.as('voteCount'),
            })
            .from(courseMaterials)
            .where(eq(courseMaterials.materialId, materialId));

        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...material,
            publicUrl: getPublicUrl(material.courseCode, material.fileUuid, material.fileExtension),
            voteCount: Number(material.voteCount),
            userVote: null,
            isOwner: false,
        }, { status: 200 });
    } catch (error) {
        console.error('Material details GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
