// app/api/merged-routine/[id]/route.js
import { auth } from "@/auth";
import { db, eq, and } from "@/lib/db";
import { savedMergedRoutine, userinfo } from "@/lib/db/schema";
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

    // Fetch merged routine from database by ID only
    const result = await db
      .select({
        routineId: savedMergedRoutine.routineId,
        routineData: savedMergedRoutine.routineData,
        email: savedMergedRoutine.email,
        createdAt: savedMergedRoutine.createdAt,
        semester: savedMergedRoutine.semester,
      })
      .from(savedMergedRoutine)
      .where(eq(savedMergedRoutine.routineId, id));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Merged routine not found" },
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
        ownerName = userResult[0].userName?.split(' ')[0] || null;
      }
    } catch (nameErr) {
      console.error("Error fetching user name:", nameErr);
    }

    return NextResponse.json({
      success: true,
      routine: {
        id: routine.routineId,
        routineData: routine.routineData,
        email: "Anonymous",
        createdAt: routine.createdAt,
        semester: routine.semester,
        ownerName: ownerName,
      }
    });

  } catch (error) {
    console.error("Error fetching merged routine:", error);
    return NextResponse.json(
      { error: "Failed to fetch merged routine" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Get authenticated user session
    const session = await auth();
    console.log("Merged Routine Delete API accessed by:", session?.user?.email);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete the routine (only if it belongs to the user)
    const result = await db
      .delete(savedMergedRoutine)
      .where(
        and(
          eq(savedMergedRoutine.routineId, id),
          eq(savedMergedRoutine.email, session.user.email)
        )
      )
      .returning({ routineId: savedMergedRoutine.routineId });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Routine not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    console.log("Deleted merged routine:", result);

    return NextResponse.json({
      success: true,
      message: "Merged routine deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting merged routine:", error);
    return NextResponse.json(
      { error: "Failed to delete merged routine" },
      { status: 500 }
    );
  }
}
