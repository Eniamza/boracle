import { db } from '@/lib/db';
import { swapRequest } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        const { requestId } = await params;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return Response.json({ error: 'Invalid status update' }, { status: 400 });
        }

        // Ensure the person accepting/rejecting is actually the receiver of the request
        const requestResult = await db
            .select()
            .from(swapRequest)
            .where(
                and(
                    eq(swapRequest.requestId, requestId),
                    eq(swapRequest.receiverEmail, session.user.email)
                )
            );

        if (requestResult.length === 0) {
            return Response.json({ error: 'Request not found or unauthorized' }, { status: 404 });
        }

        // Update the request status and set isRead to false for the sender to see
        await db
            .update(swapRequest)
            .set({ status, isRead: false })
            .where(eq(swapRequest.requestId, requestId));

        return Response.json({ message: `Swap request ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error('Error updating swap request:', error);
        return Response.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
