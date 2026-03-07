// DELETE /api/materials/[materialId] — Delete a material (owner or admin only)
import { auth } from '@/auth';
import { db, eq, and } from '@/lib/db';
import { courseMaterials, targets } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { deleteFile } from '@/lib/r2';

export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { materialId } = await params;

        // Fetch the material
        const [material] = await db
            .select()
            .from(courseMaterials)
            .where(eq(courseMaterials.materialId, materialId));

        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Check ownership or admin
        const isOwner = material.uEmail === session.user.email;
        const isAdmin = session.user.userrole === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete file from R2
        try {
            await deleteFile(material.courseCode, material.fileUuid, material.fileExtension);
        } catch (r2Error) {
            console.error('R2 delete error (continuing with DB delete):', r2Error);
        }

        // Delete the target (cascades to votes)
        await db
            .delete(targets)
            .where(
                and(
                    eq(targets.kind, 'material'),
                    eq(targets.refId, materialId)
                )
            );

        // Delete the material from DB
        await db
            .delete(courseMaterials)
            .where(eq(courseMaterials.materialId, materialId));

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Material DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
