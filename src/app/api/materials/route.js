// GET /api/materials — List materials with vote counts
// POST /api/materials — Upload a new material
import { auth } from '@/auth';
import { db, eq, and, or, ilike, lt, sql, getCurrentEpoch, inArray, desc } from '@/lib/db';
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
        const q = searchParams.get('q');
        const cursor = searchParams.get('cursor');
        const isMyMaterials = searchParams.get('isMyMaterials') === 'true';
        const stateFilter = searchParams.get('stateFilter'); // 'published' or 'pending'
        const limit = Number(searchParams.get('limit')) || 10;

        // Build base query for materials with vote aggregation
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
                // Vote aggregation via subquery
                voteCount: sql`COALESCE((
          SELECT SUM(v.value) FROM votes v
          INNER JOIN targets t ON t.uuid = v.targetuuid
          WHERE t.refid = ${courseMaterials.materialId} AND t.kind = 'material'
        ), 0)`.as('voteCount'),
                // Poster's net accumulated upvotes across all their materials
                posterNetVotes: sql`COALESCE((
          SELECT SUM(v2.value) FROM votes v2
          INNER JOIN targets t2 ON t2.uuid = v2.targetuuid
          INNER JOIN coursematerials cm2 ON cm2.materialid = t2.refid
          WHERE t2.kind = 'material' AND cm2.uemail = ${courseMaterials.uEmail}
        ), 0)`.as('posterNetVotes'),
            })
            .from(courseMaterials)
            .leftJoin(userinfo, eq(userinfo.email, courseMaterials.uEmail))
            .where(
                and(
                    isMyMaterials && currentUserEmail
                        ? (stateFilter
                            ? eq(courseMaterials.postState, stateFilter)
                            : inArray(courseMaterials.postState, ['published', 'pending']))
                        : eq(courseMaterials.postState, 'published'),
                    courseCode ? eq(courseMaterials.courseCode, courseCode) : undefined,
                    isMyMaterials && currentUserEmail ? eq(courseMaterials.uEmail, currentUserEmail) : undefined,
                    cursor ? lt(courseMaterials.createdAt, Number(cursor)) : undefined,
                    q ? or(
                        ilike(courseMaterials.courseCode, `%${q}%`),
                        ilike(courseMaterials.postDescription, `%${q}%`),
                        ilike(courseMaterials.semester, `%${q}%`)
                    ) : undefined
                )
            )
            .orderBy(desc(courseMaterials.createdAt))
            .limit(limit);

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
            publicUrl: m.fileUrl || getPublicUrl(m.courseCode, m.fileUuid, m.fileExtension),
            voteCount: Number(m.voteCount),
            userVote: userVotes[m.materialId] ?? null,
            isOwner: currentUserEmail ? currentUserEmail === m.uEmail : false,
            posterName: m.userName?.split(' ')[0] || 'Anonymous',
            posterNetVotes: Number(m.posterNetVotes),
        }));

        const nextCursor = materials.length === limit ? materials[materials.length - 1].createdAt : null;

        return NextResponse.json({
            items: response,
            nextCursor,
        }, { status: 200 });
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
        const link = formData.get('link');
        const linkType = formData.get('linkType');
        const courseCode = formData.get('courseCode');
        const semester = formData.get('semester');
        const postDescription = formData.get('postDescription');

        // Validate required fields
        if ((!file && !link) || !courseCode || !semester || !postDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate description length
        if (postDescription.length > 50) {
            return NextResponse.json({ error: 'Description must be 50 characters or less' }, { status: 400 });
        }

        let publicUrl;
        let fileUuid = randomUUID();
        let extension = linkType;

        if (file) {
            // Validate file extension
            const fileName = file.name;
            extension = fileName.split('.').pop()?.toLowerCase();
            if (!isAllowedExtension(extension)) {
                return NextResponse.json({ error: 'Invalid file type. Only pdf, pptx, doc, and docx are allowed.' }, { status: 400 });
            }

            // Get file buffer and content type
            const buffer = Buffer.from(await file.arrayBuffer());
            const contentType = file.type || (extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

            // Upload to R2
            publicUrl = await uploadFile(courseCode, fileUuid, extension, buffer, contentType);
        } else {
            if (!['youtube', 'drive'].includes(linkType)) {
                return NextResponse.json({ error: 'Invalid link type' }, { status: 400 });
            }

            let isValidUrl = false;

            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?(.*&)?v=|playlist\?(.*&)?list=)|youtu\.be\/)[a-zA-Z0-9_-]+/;
            const driveRegex = /^(https?:\/\/)?(www\.)?drive\.google\.com\/(file\/d\/|drive\/folders\/)[a-zA-Z0-9_-]+/;

            if (linkType === 'youtube') {
                isValidUrl = ytRegex.test(link);
            } else if (linkType === 'drive') {
                isValidUrl = driveRegex.test(link);
            }

            if (!isValidUrl) {
                return NextResponse.json({ error: `Invalid ${linkType} link. Must contain a specific video/file ID.` }, { status: 400 });
            }

            publicUrl = link;
        }

        // Determine initial postState based on user role
        const userRole = session.user?.userrole?.toLowerCase();
        const initialPostState = ['admin', 'moderator'].includes(userRole) ? 'published' : 'pending';

        // Insert into database
        const [material] = await db
            .insert(courseMaterials)
            .values({
                uEmail: session.user.email,
                fileUuid,
                fileUrl: link || null,
                fileExtension: extension,
                courseCode,
                semester,
                postDescription,
                postState: initialPostState,
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
