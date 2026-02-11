// app/api/routine/[id]/route.js (App Router)
import { auth } from "@/auth";
import { db, eq } from "@/lib/db";
import { savedRoutine, userinfo } from "@/lib/db/schema";
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
    const result = await db
      .select({
        routineId: savedRoutine.routineId,
        routineStr: savedRoutine.routineStr,
        email: savedRoutine.email,
        createdAt: savedRoutine.createdAt,
        semester: savedRoutine.semester,
      })
      .from(savedRoutine)
      .where(eq(savedRoutine.routineId, id));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 }
      );
    }

    const routine = result[0];

    // Fetch the owner's name from userinfo table
    let ownerName = null;
    try {
      const userResult = await db
        .select({ userName: userinfo.userName })
        .from(userinfo)
        .where(eq(userinfo.email, routine.email));
      if (userResult.length > 0) {
        // Get just the first name
        ownerName = userResult[0].userName?.split(' ')[0] || null;
      }
    } catch (nameErr) {
      console.error("Error fetching user name:", nameErr);
    }

    return NextResponse.json({
      success: true,
      routine: {
        id: routine.routineId,
        routineStr: routine.routineStr,
        email: "Anonymous",
        createdAt: routine.createdAt,
        semester: routine.semester,
        ownerName: ownerName,
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
    const existingRoutine = await db
      .select({ email: savedRoutine.email })
      .from(savedRoutine)
      .where(eq(savedRoutine.routineId, id));

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
    const result = await db
      .delete(savedRoutine)
      .where(eq(savedRoutine.routineId, id))
      .returning({ routineId: savedRoutine.routineId });

    return NextResponse.json({
      success: true,
      message: "Routine deleted successfully",
      deletedRoutineId: result[0].routineId
    });

  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { error: "Failed to delete routine" },
      { status: 500 }
    );
  }
}
