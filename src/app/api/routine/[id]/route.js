// app/api/routine/[id]/route.js (App Router)
import { auth } from "@/auth";
import { sql } from "@/lib/pgdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Routine ID is required" },
        { status: 400 }
      );
    }

    // Fetch routine from database by ID only
    const result = await sql`
      SELECT routineID, routineStr, email
      FROM savedroutine 
      WHERE routineID = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    const routine = result[0];

    return NextResponse.json({
      success: true,
      routine: {
        id: routine.routineid,
        routineStr: routine.routinestr,
        email: "Anonymous"
      }
    });

  } catch (error) {
    console.error("Error fetching routine:", error);
    return NextResponse.json(
      { error: "Failed to fetch routine" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Routine DELETE API accessed by:", session?.user?.email);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Routine ID is required" },
        { status: 400 }
      );
    }

    // First check if routine exists and belongs to user
    const existingRoutine = await sql`
      SELECT email FROM savedroutine WHERE routineID = ${id}
    `;

    if (existingRoutine.length === 0) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    if (existingRoutine[0].email !== session.user.email) {
      return NextResponse.json(
        { error: "Access denied. You can only delete your own routines." },
        { status: 403 }
      );
    }

    // Delete the routine
    const result = await sql`
      DELETE FROM savedroutine 
      WHERE routineID = ${id}
      RETURNING routineID
    `;

    return NextResponse.json({
      success: true,
      message: "Routine deleted successfully",
      deletedRoutineId: result[0].routineid
    });

  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { error: "Failed to delete routine" },
      { status: 500 }
    );
  }
}
