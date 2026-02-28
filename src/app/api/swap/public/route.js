// Public API to get all active swaps with anonymized data
// Returns only: getSectionId, askingSections, createdAt (no user info)
import { db, eq } from "@/lib/db";
import { courseSwap, askSectionId } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch all swaps and all asking sections in just 2 queries
        const swapRequests = await db
            .select({
                swapId: courseSwap.swapId,
                getSectionId: courseSwap.getSectionId,
                createdAt: courseSwap.createdAt,
                isDone: courseSwap.isDone,
                semester: courseSwap.semester,
            })
            .from(courseSwap);

        const allAskingSections = await db
            .select({
                swapId: askSectionId.swapId,
                askSectionId: askSectionId.askSectionId,
            })
            .from(askSectionId);

        // Group asking sections by swapId in memory
        const askingMap = {};
        for (const row of allAskingSections) {
            if (!askingMap[row.swapId]) askingMap[row.swapId] = [];
            askingMap[row.swapId].push(row.askSectionId);
        }

        const swaps = swapRequests.map(swap => ({
            swapId: swap.swapId,
            isDone: swap.isDone,
            getSectionId: swap.getSectionId,
            createdAt: swap.createdAt,
            semester: swap.semester,
            askingSections: askingMap[swap.swapId] || [],
        }));

        return NextResponse.json(swaps, { status: 200 });
    } catch (error) {
        console.error("Public swap API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
