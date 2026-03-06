import { db } from '@/lib/db';
import { swapRequest, courseSwap, userinfo } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { Resend } from 'resend';
import { swapRequestStatusTemplate } from '@/constants/mailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status, courseName } = await req.json();
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

        // Send email notification to the sender of the request
        try {
            const reqData = requestResult[0];
            const senderEmail = reqData.senderEmail;

            // Get swap info for the section name
            const swapInfoResult = await db.select({ getSectionId: courseSwap.getSectionId }).from(courseSwap).where(eq(courseSwap.swapId, reqData.swapId));
            const sectionStr = courseName || (swapInfoResult.length > 0 && swapInfoResult[0].getSectionId
                ? (Array.isArray(swapInfoResult[0].getSectionId) ? swapInfoResult[0].getSectionId.join(', ') : swapInfoResult[0].getSectionId)
                : "a section");

            // Get receiver's name (the one who accepted/rejected)
            const receiverResult = await db.select({ userName: userinfo.userName }).from(userinfo).where(eq(userinfo.email, session.user.email));
            const receiverName = receiverResult.length > 0 ? receiverResult[0].userName : "A student";

            await resend.emails.send({
                from: 'Boracle <swap@notifications.boracle.app>',
                to: senderEmail,
                subject: `Swap Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
                html: swapRequestStatusTemplate(receiverName, status, sectionStr)
            });
        } catch (emailError) {
            console.error('Error sending swap request status update email:', emailError);
        }

        return Response.json({ message: `Swap request ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error('Error updating swap request:', error);
        return Response.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
