// app/api/swap/route.js (App Router)
import { auth } from "@/auth";
import { db, eq, getCurrentEpoch } from "@/lib/db";
import { courseSwap, askSectionId } from "@/lib/db/schema";
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

    // Fetch all swaps and all asking sections in just 2 queries
    const swapRequest = await db
      .select()
      .from(courseSwap);

    const allAskingSections = await db
      .select({
        swapId: askSectionId.swapId,
        askSectionId: askSectionId.askSectionId,
      })
      .from(askSectionId);

    // Group asking sections by swapId in memory
    const askingMap = {};
    for (const row of allAskingSections) {
      if (!askingMap[row.swapId]) askingMap[row.swapId] = [];
      askingMap[row.swapId].push(row.askSectionId);
    }

    const currentUserEmail = session.user.email;
    const swaps = swapRequest.map(element => ({
      swapId: element.swapId,
      isDone: element.isDone,
      getSectionId: element.getSectionId,
      createdAt: element.createdAt,
      semester: element.semester,
      isOwner: currentUserEmail === element.uEmail,
      askingSections: askingMap[element.swapId] || [],
    }));

    // console.log("Swap Requests:", swaps);

    return NextResponse.json(swaps, { status: 200 });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Get authenticated user session
    const session = await auth();
    console.log("Swap List API accessed by:", session?.user?.email);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetching the Swap request 
    const uEmail = session.user.email;
    const { givingSection, askingSection } = await request.json();

    // Save to database with current semester
    const createSwap = await db
      .insert(courseSwap)
      .values({
        getSectionId: givingSection,
        uEmail: uEmail,
        createdAt: getCurrentEpoch(),
        semester: globalInfo.semester,
      })
      .returning({ swapId: courseSwap.swapId });

    for (const element of askingSection) {
      await db
        .insert(askSectionId)
        .values({
          swapId: createSwap[0].swapId,
          askSectionId: element,
        });
    }

    return NextResponse.json({ success: true, swapId: createSwap[0].swapId }, { status: 200 });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
