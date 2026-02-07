// app/api/faculty/[id]/route.js (App Router)
import { auth } from "@/auth";
import { db, eq } from "@/lib/db";
import { faculty, initial } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request, { params }) {
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

    // Fetch faculty information based on id passed in the [id] route
    const { id } = await params;

    const facultyResult = await db
      .select()
      .from(faculty)
      .where(eq(faculty.facultyId, id));

    if (facultyResult.length === 0) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const initials = await db
      .select({ facultyInitial: initial.facultyInitial })
      .from(initial)
      .where(eq(initial.facultyId, id));

    let facultyInitials = initials.map(element => element.facultyInitial);
    console.log("Initials:", facultyInitials);

    const facultyData = { ...facultyResult[0] };
    if (facultyInitials.length > 0) {
      facultyData.initials = facultyInitials;
    }

    return NextResponse.json(facultyData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}