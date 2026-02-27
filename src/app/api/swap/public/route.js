// Public API to get all active swaps with anonymized data
// Returns only: getSectionId, askingSections, createdAt (no user info)
import { db, eq } from "@/lib/db";
import { courseSwap, askSectionId } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch all active (not done) course swaps
        const swapRequests = await db
            .select({
                swapId: courseSwap.swapId,
                getSectionId: courseSwap.getSectionId,
                createdAt: courseSwap.createdAt,
                isDone: courseSwap.isDone,
                semester: courseSwap.semester,
            })
            .from(courseSwap);

        const swaps = [];

        for (const swap of swapRequests) {
            const askingSections = await db
                .select({ askSectionId: askSectionId.askSectionId })
                .from(askSectionId)
                .where(eq(askSectionId.swapId, swap.swapId));

            swaps.push({
                swapId: swap.swapId,
                isDone: swap.isDone,
                getSectionId: swap.getSectionId,
                createdAt: swap.createdAt,
                semester: swap.semester,
                askingSections: askingSections.map(item => item.askSectionId),
            });
        }

        return NextResponse.json(swaps, { status: 200 });
    } catch (error) {
        console.error("Public swap API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
