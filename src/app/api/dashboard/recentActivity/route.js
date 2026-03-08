// app/api/dashboard/recentActivity/route.js (App Router)
import { auth } from "@/auth";
import { db, eq, desc, or } from "@/lib/db";
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

    // Fetch recent materials from the community (published) PLUS user's own (published/pending/rejected)
    // We'll limit to 5 total
    const recentMaterials = await db.select({
      materialId: courseMaterials.materialId,
      uEmail: courseMaterials.uEmail,
      fileUrl: courseMaterials.fileUrl,
      fileExtension: courseMaterials.fileExtension,
      createdAt: courseMaterials.createdAt,
      courseCode: courseMaterials.courseCode,
      semester: courseMaterials.semester,
      postState: courseMaterials.postState,
      postDescription: courseMaterials.postDescription
    })
      .from(courseMaterials)
      .where(
        or(
          eq(courseMaterials.postState, 'published'),
          eq(courseMaterials.uEmail, userEmail)
        )
      )
      .orderBy(desc(courseMaterials.createdAt))
      .limit(5);

    return Response.json({
      recentActivities: {
        materials: recentMaterials
      }
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}