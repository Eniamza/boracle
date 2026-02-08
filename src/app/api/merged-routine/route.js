// app/api/merged-routine/route.js
import { auth } from "@/auth";
import { db, eq, desc, getCurrentEpoch } from "@/lib/db";
import { savedMergedRoutine } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import globalInfo from "@/constants/globalInfo";

export async function GET(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Merged Routine List API accessed by:", session?.user?.email);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all merged routines for the current user
    const result = await db
      .select({
        routineId: savedMergedRoutine.routineId,
        routineData: savedMergedRoutine.routineData,
        email: savedMergedRoutine.email,
        createdAt: savedMergedRoutine.createdAt,
        semester: savedMergedRoutine.semester,
      })
      .from(savedMergedRoutine)
      .where(eq(savedMergedRoutine.email, session.user.email))
      .orderBy(desc(savedMergedRoutine.createdAt));

    console.log("Fetched merged routines:", result);

    return NextResponse.json({
      success: true,
      routines: result.map(routine => ({
        id: routine.routineId,
        routineData: routine.routineData,
        email: routine.email,
        createdAt: routine.createdAt,
        semester: routine.semester
      }))
    });

  } catch (error) {
    console.error("Error fetching merged routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch merged routines" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Merged Routine Save API accessed by:", session?.user?.email);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { routineData } = body;

    if (!routineData) {
      return NextResponse.json(
        { error: "Routine data is required" },
        { status: 400 }
      );
    }

    // Save the merged routine to database with current semester
    const result = await db
      .insert(savedMergedRoutine)
      .values({
        routineData: routineData,
        email: session.user.email,
        createdAt: getCurrentEpoch(),
        semester: globalInfo.semester,
      })
      .returning({ routineId: savedMergedRoutine.routineId });

    console.log("Saved merged routine:", result);

    return NextResponse.json({
      success: true,
      routineId: result[0].routineId
    });

  } catch (error) {
    console.error("Error saving merged routine:", error);
    return NextResponse.json(
      { error: "Failed to save merged routine" },
      { status: 500 }
    );
  }
}
