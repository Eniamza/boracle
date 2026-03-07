import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courseMaterials, userinfo } from '@/lib/db/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req) {
    try {
        const session = await auth();
        const userRole = session?.user?.userrole?.toLowerCase();

        if (!session?.user?.email || (userRole !== 'admin' && userRole !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sortOrder = searchParams.get('sort') || 'desc'; // 'asc' or 'desc' for voteCount

        // Fetch pending materials with vote counts and user info
        const materials = await db
            .select({
                materialId: courseMaterials.materialId,
                fileUuid: courseMaterials.fileUuid,
                fileUrl: courseMaterials.fileUrl,
                fileExtension: courseMaterials.fileExtension,
                courseCode: courseMaterials.courseCode,
                semester: courseMaterials.semester,
                postDescription: courseMaterials.postDescription,
                postState: courseMaterials.postState,
                createdAt: courseMaterials.createdAt,
                uEmail: courseMaterials.uEmail,
                userName: userinfo.userName,
                voteCount: sql`COALESCE((
                    SELECT SUM(value) FROM votes 
                    INNER JOIN targets ON votes.targetuuid = targets.uuid
                    WHERE targets.kind = 'material' AND targets.refid = ${courseMaterials.materialId}
                ), 0)`.as('voteCount'),
            })
            .from(courseMaterials)
            .leftJoin(userinfo, eq(userinfo.email, courseMaterials.uEmail))
            .where(eq(courseMaterials.postState, 'pending'))
            .orderBy(
                sortOrder === 'asc'
                    ? asc(sql`COALESCE((SELECT SUM(value) FROM votes INNER JOIN targets ON votes.targetuuid = targets.uuid WHERE targets.kind = 'material' AND targets.refid = ${courseMaterials.materialId}), 0)`)
                    : desc(sql`COALESCE((SELECT SUM(value) FROM votes INNER JOIN targets ON votes.targetuuid = targets.uuid WHERE targets.kind = 'material' AND targets.refid = ${courseMaterials.materialId}), 0)`),
                desc(courseMaterials.createdAt)
            );

        return NextResponse.json({
            items: materials.map(m => ({
                ...m,
                voteCount: Number(m.voteCount)
            }))
        });
    } catch (error) {
        console.error('Moderation API GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
