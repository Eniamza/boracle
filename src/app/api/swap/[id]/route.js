// app/api/swap/[id]/route.js (App Router)
import { auth } from "@/auth";
import { db, eq } from "@/lib/db";
import { courseSwap } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
    try {
        // Get authenticated user session
        const session = await auth();
        console.log("Swap DELETE API accessed by:", session?.user?.email);

        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Swap ID is required" },
                { status: 400 }
            );
        }

        // First check if swap exists and belongs to user
        const existingSwap = await db
            .select({ uEmail: courseSwap.uEmail })
            .from(courseSwap)
            .where(eq(courseSwap.swapId, id));

        if (existingSwap.length === 0) {
            return NextResponse.json(
                { error: "Swap not found" },
                { status: 404 }
            );
        }

        if (existingSwap[0].uEmail !== session.user.email) {
            return NextResponse.json(
                { error: "Access denied. You can only delete your own swaps." },
                { status: 403 }
            );
        }

        // Delete the swap
        const result = await db
            .delete(courseSwap)
            .where(eq(courseSwap.swapId, id))
            .returning({ swapId: courseSwap.swapId });

        return NextResponse.json({
            success: true,
            message: "Swap deleted successfully",
            deletedSwapId: result[0].swapId
        });

    } catch (error) {
        console.error("Error deleting swap:", error);
        return NextResponse.json(
            { error: "Failed to delete swap" },
            { status: 500 }
        );
    }
}

// PATCH to set isDone to true
export async function PATCH(request, { params }) {
    try {
        // Get authenticated user session
        const session = await auth();
        console.log("Swap PATCH API accessed by:", session?.user?.email);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Swap ID is required" },
                { status: 400 }
            );
        }

        // First check if swap exists and belongs to user
        const existingSwap = await db
            .select({ uEmail: courseSwap.uEmail })
            .from(courseSwap)
            .where(eq(courseSwap.swapId, id));

        if (existingSwap.length === 0) {
            return NextResponse.json(
                { error: "Swap not found" },
                { status: 404 }
            );
        }

        if (existingSwap[0].uEmail !== session.user.email) {
            return NextResponse.json(
                { error: "Access denied. You can only update your own swaps." },
                { status: 403 }
            );
        }

        // Update the swap to set isDone to true
        const result = await db
            .update(courseSwap)
            .set({ isDone: true })
            .where(eq(courseSwap.swapId, id))
            .returning({ swapId: courseSwap.swapId, isDone: courseSwap.isDone });

        return NextResponse.json({
            success: true,
            message: "Swap marked as done",
            updatedSwap: result[0]
        });

    } catch (error) {
        console.error("Error updating swap:", error);
        return NextResponse.json(
            { error: "Failed to update swap" },
            { status: 500 }
        );
    }
}
