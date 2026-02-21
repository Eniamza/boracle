import { db } from '@/lib/db';
import { courseSwap, swapRequest, userinfo } from '@/lib/db/schema';
import { eq, or, desc, and } from 'drizzle-orm';
import { auth } from '@/auth';

// Fetch Notifications (Requests) for the logged-in user
export async function GET(req) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;

        // We want to fetch all requests where:
        // 1. The user is the receiver (someone requested their swap)
        // 2. The user is the sender AND the status is ACCEPTED (the owner accepted their request, revealing emails)
        const requests = await db
            .select({
                requestId: swapRequest.requestId,
                swapId: swapRequest.swapId,
                senderEmail: swapRequest.senderEmail,
                receiverEmail: swapRequest.receiverEmail,
                status: swapRequest.status,
                isRead: swapRequest.isRead,
                createdAt: swapRequest.createdAt,

                // Joined Data (Sender details)
                senderName: userinfo.userName, // e.g. "Tashfeen"

                // Joined Data (Swap details)
                getSectionId: courseSwap.getSectionId,
            })
            .from(swapRequest)
            .leftJoin(userinfo, eq(swapRequest.senderEmail, userinfo.email))
            .leftJoin(courseSwap, eq(swapRequest.swapId, courseSwap.swapId))
            .where(
                or(
                    eq(swapRequest.receiverEmail, userEmail),
                    eq(swapRequest.senderEmail, userEmail)
                )
            )
            .orderBy(desc(swapRequest.createdAt));

        // For privacy, if the user is the receiver and the status is PENDING, 
        // we should NOT expose the sender's full email, only their name
        const sanitizedRequests = requests.map(req => {
            // Extract first name and ensure Capitalized case (e.g. "TASHFEEN" -> "Tashfeen", "tashfeen" -> "Tashfeen")
            let firstName = req.senderName?.split(' ')[0] || 'A student';
            if (firstName !== 'A student') {
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            }

            const isReceiver = req.receiverEmail === userEmail;
            const isSender = req.senderEmail === userEmail;

            let safeSenderEmail = null;
            let safeReceiverEmail = null;

            if (req.status === 'ACCEPTED') {
                // Full reveal!
                safeSenderEmail = req.senderEmail;
                safeReceiverEmail = req.receiverEmail;
            } else {
                // Pending: Only the sender knows who they sent it to. Receiver only gets the first name.
                if (isSender) safeReceiverEmail = req.receiverEmail;
            }

            return {
                requestId: req.requestId,
                swapId: req.swapId,
                status: req.status,
                isRead: req.isRead,
                createdAt: req.createdAt,
                getSectionId: req.getSectionId,

                // Contextual identification
                senderFirstName: firstName,
                senderEmail: safeSenderEmail,
                receiverEmail: safeReceiverEmail,

                // Helper flag for UI
                type: isReceiver ? 'INCOMING' : 'OUTGOING',
            };
        });

        return Response.json(sanitizedRequests);
    } catch (error) {
        console.error('Error fetching swap requests:', error);
        return Response.json({ error: 'Failed to fetch swap requests' }, { status: 500 });
    }
}

// Create a new Swap Request
export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { swapId } = await req.json();

        if (!swapId) {
            return Response.json({ error: 'Swap ID is required' }, { status: 400 });
        }

        const senderEmail = session.user.email;

        // 1. Get the swap details to find the receiver
        const swapResult = await db.select().from(courseSwap).where(eq(courseSwap.swapId, swapId));
        if (!swapResult.length) {
            return Response.json({ error: 'Swap not found' }, { status: 404 });
        }

        const swapInfo = swapResult[0];
        const receiverEmail = swapInfo.uEmail;

        // 2. Prevent requesting your own swap
        if (senderEmail === receiverEmail) {
            return Response.json({ error: 'Cannot request your own swap' }, { status: 400 });
        }

        // 3. Prevent duplicate requests from the same user to the same swap
        const existingReq = await db
            .select()
            .from(swapRequest)
            .where(and(eq(swapRequest.swapId, swapId), eq(swapRequest.senderEmail, senderEmail)));

        if (existingReq.length > 0) {
            return Response.json({ error: 'You have already requested this swap' }, { status: 400 });
        }

        // 4. Create the new request
        await db.insert(swapRequest).values({
            swapId,
            senderEmail,
            receiverEmail,
            status: 'PENDING',
            createdAt: Math.floor(Date.now() / 1000), // UNIX epoch seconds
        });

        return Response.json({ message: 'Swap request created successfully' });
    } catch (error) {
        console.error('Error creating swap request:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Mark all outgoing requests as read
export async function PATCH() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await db
            .update(swapRequest)
            .set({ isRead: true })
            .where(
                and(
                    eq(swapRequest.senderEmail, session.user.email),
                    eq(swapRequest.isRead, false)
                )
            );

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error marking requests as read:', error);
        return Response.json({ error: 'Failed to mark requests as read' }, { status: 500 });
    }
}
