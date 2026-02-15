// app/api/routine/route.js (App Router)
import { auth } from "@/auth";
import { db, eq, desc, getCurrentEpoch } from "@/lib/db";
import { savedRoutine } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import globalInfo from "@/constants/globalInfo";

export async function GET(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Routine List API accessed by:", session?.user?.email);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all routines for the current user
    const result = await db
      .select({
        routineId: savedRoutine.routineId,
        routineStr: savedRoutine.routineStr,
        email: savedRoutine.email,
        createdAt: savedRoutine.createdAt,
        semester: savedRoutine.semester,
        routineName: savedRoutine.routineName,
      })
      .from(savedRoutine)
      .where(eq(savedRoutine.email, session.user.email))
      .orderBy(desc(savedRoutine.createdAt));

    console.log("Fetched routines:", result);

    return NextResponse.json({
      success: true,
      routines: result.map(routine => ({
        id: routine.routineId,
        routineStr: routine.routineStr,
        email: routine.email,
        createdAt: routine.createdAt,
        semester: routine.semester,
        routineName: routine.routineName
      }))
    });

  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Routine Save API accessed by:", session?.user?.email);
    if (!session || !session.user?.email) {

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { routineStr, email } = await request.json();

    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403 }
      );
    }

    console.log(globalInfo)
    // Save to database
    const result = await db
      .insert(savedRoutine)
      .values({
        routineStr: routineStr,
        email: session.user.email,
        semester: globalInfo.semester,
        createdAt: getCurrentEpoch(),
      })
      .returning({ routineId: savedRoutine.routineId });

    return NextResponse.json({
      success: true,
      routineId: result[0].routineId
    });

  } catch (error) {
    console.error("Error saving routine:", error);
    return NextResponse.json(
      { error: "Failed to save routine" },
      { status: 500 }
    );
  }
}