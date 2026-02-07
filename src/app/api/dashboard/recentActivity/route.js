// app/api/dashboard/recentActivity/route.js (App Router)
import { auth } from "@/auth";
import { db, eq, desc } from "@/lib/db";
import { reviews, courseMaterials } from "@/lib/db/schema";
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

    // Fetch recent activities and post status from the tables reviews and courseMaterials
    const [recentReviews, recentMaterials] = await Promise.all([
      db.select()
        .from(reviews)
        .where(eq(reviews.uEmail, userEmail))
        .orderBy(desc(reviews.createdAt))
        .limit(5),
      db.select()
        .from(courseMaterials)
        .where(eq(courseMaterials.uEmail, userEmail))
        .orderBy(desc(courseMaterials.createdAt))
        .limit(5)
    ]);

    return Response.json({
      recentActivities: {
        reviews: recentReviews,
        materials: recentMaterials
      }
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}