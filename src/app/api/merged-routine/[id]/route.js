// app/api/merged-routine/[id]/route.js
import { auth } from "@/auth";
import { db, eq, and } from "@/lib/db";
import { savedMergedRoutine } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

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
