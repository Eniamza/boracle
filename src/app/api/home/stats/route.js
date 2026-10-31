// GET API that fetches total swaps, reviews, materials

import { db, sql } from "@/lib/db";
import { courseSwap, reviews, courseMaterials, userinfo, faculty } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const [totalSwaps, totalReviews, totalMaterials, totalUsers, totalFaculties] = await Promise.all([
            db.select({ count: sql`count(*)` }).from(courseSwap),
            db.select({ count: sql`count(*)` }).from(reviews),
            db.select({ count: sql`count(*)` }).from(courseMaterials),
            db.select({ count: sql`count(*)` }).from(userinfo),
            db.select({ count: sql`count(*)` }).from(faculty)
        ]);
        return NextResponse.json({
            totalSwaps: totalSwaps[0].count,
            totalReviews: totalReviews[0].count,
            totalMaterials: totalMaterials[0].count,
            totalUsers: totalUsers[0].count,
            totalFaculties: totalFaculties[0].count
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
