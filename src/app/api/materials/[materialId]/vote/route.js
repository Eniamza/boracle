// POST /api/materials/[materialId]/vote — Cast or update a vote
// DELETE /api/materials/[materialId]/vote — Remove own vote
import { auth } from '@/auth';
import { db, eq, and, getCurrentEpoch } from '@/lib/db';
import { targets, votes } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { materialId } = await params;
        const { value } = await req.json();

        // Validate vote value
        if (value !== 1 && value !== -1) {
            return NextResponse.json({ error: 'Vote value must be 1 or -1' }, { status: 400 });
        }

        // Find the target for this material
        const [target] = await db
            .select()
            .from(targets)
            .where(
                and(
                    eq(targets.kind, 'material'),
                    eq(targets.refId, materialId)
                )
            );

        if (!target) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Upsert vote (insert or update on conflict)
        const existingVote = await db
            .select()
            .from(votes)
            .where(
                and(
                    eq(votes.uEmail, session.user.email),
                    eq(votes.targetUuid, target.uuid)
                )
            );

        if (existingVote.length > 0) {
            // Update existing vote
            await db
                .update(votes)
                .set({ value, createdAt: getCurrentEpoch() })
                .where(
                    and(
                        eq(votes.uEmail, session.user.email),
                        eq(votes.targetUuid, target.uuid)
                    )
                );
        } else {
            // Insert new vote
            await db
                .insert(votes)
                .values({
                    uEmail: session.user.email,
                    targetUuid: target.uuid,
                    value,
                    createdAt: getCurrentEpoch(),
                });
        }

        return NextResponse.json({ success: true, value }, { status: 200 });
    } catch (error) {
        console.error('Vote POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { materialId } = await params;

        // Find the target for this material
        const [target] = await db
            .select()
            .from(targets)
            .where(
                and(
                    eq(targets.kind, 'material'),
                    eq(targets.refId, materialId)
                )
            );

        if (!target) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        // Delete the vote
        await db
            .delete(votes)
            .where(
                and(
                    eq(votes.uEmail, session.user.email),
                    eq(votes.targetUuid, target.uuid)
                )
            );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Vote DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
