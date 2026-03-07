// GET /api/materials — List materials with vote counts
// POST /api/materials — Upload a new material
import { auth } from '@/auth';
import { db, eq, and, sql, getCurrentEpoch, inArray, desc } from '@/lib/db';
import { courseMaterials, targets, votes, userinfo } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { uploadFile, getPublicUrl, isAllowedExtension } from '@/lib/r2';
import { randomUUID } from 'crypto';

export async function GET(req) {
    try {
        const session = await auth();
        const currentUserEmail = session?.user?.email;

        const { searchParams } = new URL(req.url);
        const courseCode = searchParams.get('courseCode');

        // Build base query for materials with vote aggregation
        const materials = await db
            .select({
                materialId: courseMaterials.materialId,
                fileUuid: courseMaterials.fileUuid,
                fileExtension: courseMaterials.fileExtension,
                courseCode: courseMaterials.courseCode,
                semester: courseMaterials.semester,
                postDescription: courseMaterials.postDescription,
                postState: courseMaterials.postState,
                createdAt: courseMaterials.createdAt,
                uEmail: courseMaterials.uEmail,
                // Vote aggregation via subquery
                voteCount: sql`COALESCE((
          SELECT SUM(v.value) FROM votes v
          INNER JOIN targets t ON t.uuid = v.targetuuid
          WHERE t.refid = ${courseMaterials.materialId} AND t.kind = 'material'
        ), 0)`.as('voteCount'),
            })
            .from(courseMaterials)
            .where(
                courseCode
                    ? eq(courseMaterials.courseCode, courseCode)
                    : undefined
            )
            .orderBy(desc(courseMaterials.createdAt));

        // If logged in, fetch user's votes for these materials
        let userVotes = {};
        if (currentUserEmail && materials.length > 0) {
            const materialIds = materials.map(m => m.materialId);
            const userVoteRows = await db
                .select({
                    refId: targets.refId,
                    value: votes.value,
                })
                .from(votes)
                .innerJoin(targets, eq(targets.uuid, votes.targetUuid))
                .where(
                    and(
                        eq(votes.uEmail, currentUserEmail),
                        eq(targets.kind, 'material'),
                        inArray(targets.refId, materialIds)
                    )
                );

            for (const row of userVoteRows) {
                userVotes[row.refId] = row.value;
            }
        }

        // Build response with public URLs and user votes
        const response = materials.map(m => ({
            materialId: m.materialId,
            courseCode: m.courseCode,
            semester: m.semester,
            postDescription: m.postDescription,
            postState: m.postState,
            fileExtension: m.fileExtension,
            createdAt: m.createdAt,
            publicUrl: getPublicUrl(m.courseCode, m.fileUuid, m.fileExtension),
            voteCount: Number(m.voteCount),
            userVote: userVotes[m.materialId] ?? null,
            isOwner: currentUserEmail ? currentUserEmail === m.uEmail : false,
        }));

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error('Materials GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        const courseCode = formData.get('courseCode');
        const semester = formData.get('semester');
        const postDescription = formData.get('postDescription');

        // Validate required fields
        if (!file || !courseCode || !semester || !postDescription) {
            return NextResponse.json({ error: 'Missing required fields: file, courseCode, semester, postDescription' }, { status: 400 });
        }

        // Validate file extension
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (!isAllowedExtension(extension)) {
            return NextResponse.json({ error: 'Invalid file type. Only pdf and pptx are allowed.' }, { status: 400 });
        }

        // Get file buffer and content type
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentType = file.type || (extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

        // Generate UUID for file
        const fileUuid = randomUUID();

        // Upload to R2
        const publicUrl = await uploadFile(courseCode, fileUuid, extension, buffer, contentType);

        // Insert into database
        const [material] = await db
            .insert(courseMaterials)
            .values({
                uEmail: session.user.email,
                fileUuid,
                fileExtension: extension,
                courseCode,
                semester,
                postDescription,
                createdAt: getCurrentEpoch(),
            })
            .returning();

        // Create a target entry for voting
        await db
            .insert(targets)
            .values({
                kind: 'material',
                refId: material.materialId,
            });

        return NextResponse.json({
            materialId: material.materialId,
            publicUrl,
            courseCode,
            fileExtension: extension,
        }, { status: 201 });
    } catch (error) {
        console.error('Materials POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
