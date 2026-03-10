import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courseMaterials, moderatesCourseMaterials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { Resend } from 'resend';
import { materialApprovedTemplate, materialRejectedTemplate } from '@/constants/mailTemplates';
import { deleteFile } from '@/lib/r2';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function PATCH(req, { params }) {
    try {
        const session = await auth();
        const userRole = session?.user?.userrole?.toLowerCase();
        const moderatorEmail = session?.user?.email;

        if (!moderatorEmail || (userRole !== 'admin' && userRole !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { materialId } = await params;
        const body = await req.json();
        const { action, postDescription } = body;

        if (!['approve', 'reject', 'save'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be approve, reject, or save.' }, { status: 400 });
        }

        // Fetch current material to get email, courseCode, and file details
        const [material] = await db
            .select()
            .from(courseMaterials)
            .where(eq(courseMaterials.materialId, materialId));

        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }


        const epoch = Math.floor(Date.now() / 1000);

        if (action === 'approve') {
            const finalDescription = postDescription?.trim() || material.postDescription;

            // 1. Update material state and description
            await db.update(courseMaterials)
                .set({
                    postState: 'published',
                    postDescription: finalDescription
                })
                .where(eq(courseMaterials.materialId, materialId));

            // 2. Log moderation action
            await db.insert(moderatesCourseMaterials).values({
                materialId,
                moderatorEmail,
                moderatedAt: epoch,
                decisionState: 'APPROVED',
                comment: 'Approved via moderation dashboard'
            }).onConflictDoNothing();

            // 3. Send approval email
            if (resend) {
                try {
                    const { error } = await resend.emails.send({
                        from: 'Boracle <swap@notifications.boracle.app>',
                        to: material.uEmail,
                        subject: 'Your study material was approved!',
                        html: materialApprovedTemplate(material.courseCode, finalDescription)
                    });

                    if (error) {
                        console.error('Resend API error sending approval email:', error);
                    }
                } catch (e) {
                    console.error('Failed to send approval email:', e);
                }
            }
        } else if (action === 'save') {
            const finalDescription = postDescription?.trim() || material.postDescription;

            await db.update(courseMaterials)
                .set({
                    postDescription: finalDescription
                })
                .where(eq(courseMaterials.materialId, materialId));
        } else if (action === 'reject') {
            // 1. Delete file from R2 if it's an uploaded file (not a youtube/drive/github link)
            const isExternalLink = ['youtube', 'drive', 'github'].includes(material.fileExtension);
            if (!isExternalLink) {
                try {
                    await deleteFile(material.courseCode, material.fileUuid, material.fileExtension);
                } catch (e) {
                    console.error('Failed to delete file from R2 during rejection:', e);
                }
            }

            // 2. Update material to rejected state, removing access to the deleted resource
            await db.update(courseMaterials)
                .set({
                    postState: 'rejected',
                    fileUrl: 'deleted',
                    fileUuid: '00000000-0000-0000-0000-000000000000'
                })
                .where(eq(courseMaterials.materialId, materialId));

            // 3. Log moderation action
            await db.insert(moderatesCourseMaterials).values({
                materialId,
                moderatorEmail,
                moderatedAt: epoch,
                decisionState: 'REJECTED',
                comment: 'Rejected via moderation dashboard'
            }).onConflictDoNothing();

            // 4. Send rejection email
            if (resend) {
                try {
                    const { error } = await resend.emails.send({
                        from: 'Boracle <swap@notifications.boracle.app>',
                        to: material.uEmail,
                        subject: 'Notice regarding your material upload',
                        html: materialRejectedTemplate(material.courseCode, material.postDescription)
                    });

                    if (error) {
                        console.error('Resend API error sending rejection email:', error);
                    }
                } catch (e) {
                    console.error('Failed to send rejection email:', e);
                }
            }
        }

        return NextResponse.json({ message: `Material successfully ${action}d.` });

    } catch (error) {
        console.error('Moderation API PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
