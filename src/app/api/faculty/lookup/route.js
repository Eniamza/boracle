// API to get all faculty details with their initials
import { auth } from "@/auth";
import { db, eq } from "@/lib/db";
import { faculty, initial } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get authenticated user session
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all faculty with their initials in a single query
    const result = await db
      .select({
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        email: faculty.email,
        imgUrl: faculty.imgUrl,
        facultyInitial: initial.facultyInitial,
      })
      .from(initial)
      .innerJoin(faculty, eq(initial.facultyId, faculty.facultyId));

    // Build a map of initial -> faculty info
    const facultyMap = {};
    for (const row of result) {
      const initKey = row.facultyInitial?.trim().toUpperCase();
      if (initKey) {
        facultyMap[initKey] = {
          facultyName: row.facultyName,
          email: row.email,
          imgUrl: row.imgUrl,
        };
      }
    }

    return NextResponse.json({
      success: true,
      facultyMap,
    });
  } catch (error) {
    console.error("Error fetching faculty data:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculty data" },
      { status: 500 }
    );
  }
}
