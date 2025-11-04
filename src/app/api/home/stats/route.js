// GET API that fetches total swaps, reviews, materials

import { auth } from "@/auth";
import { sql } from "@/lib/pgdb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await auth();
        const [totalSwaps, totalReviews, totalMaterials] = await Promise.all([
            sql`SELECT COUNT(*) FROM courseSwap`,
            sql`SELECT COUNT(*) FROM reviews`,
            sql`SELECT COUNT(*) FROM courseMaterials`
        ]);
        return NextResponse.json({
            totalSwaps: totalSwaps[0].count,
            totalReviews: totalReviews[0].count,
            totalMaterials: totalMaterials[0].count
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
