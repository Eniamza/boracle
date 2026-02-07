// app/api/dashboard/userStatCount/route.js (App Router)
import { auth } from "@/auth";
import { db, eq, sql } from "@/lib/db";
import { reviews, courseMaterials, courseSwap, votes } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Dashboard API accessed by:", session?.user?.email);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Fetch all counts in parallel
    const [reviewCount, materialCount, swapCount, voteCount] = await Promise.all([
      // Count reviews
      db.select({ count: sql`count(*)` }).from(reviews).where(eq(reviews.uEmail, userEmail)),
      
      // Count materials
      db.select({ count: sql`count(*)` }).from(courseMaterials).where(eq(courseMaterials.uEmail, userEmail)),
      
      // Count swaps
      db.select({ count: sql`count(*)` }).from(courseSwap).where(eq(courseSwap.uEmail, userEmail)),
      
      // Count votes
      db.select({ count: sql`count(*)` }).from(votes).where(eq(votes.uEmail, userEmail))
    ]);

    return Response.json({
      counts: {
        reviews: parseInt(reviewCount[0]?.count || 0),
        materials: parseInt(materialCount[0]?.count || 0),
        swaps: parseInt(swapCount[0]?.count || 0),
        votes: parseInt(voteCount[0]?.count || 0)
      }
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}