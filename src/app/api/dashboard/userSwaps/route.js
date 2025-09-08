import { auth } from "@/auth";
import { sql } from "@/lib/pgdb";
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

    const userEmail = 'alice.wong@g.bracu.ac.bd';

    // Fetch all counts in parallel
    const swapRequest = await sql`SELECT * FROM courseSwap WHERE uEmail = ${userEmail}`;
    let swaps = []

    for (const element of swapRequest){
        let askingSections = await sql`SELECT askSectionID FROM askSectionID WHERE swapID = ${element.swapid}`;
        element.askingSections = askingSections.map(item => item.asksectionid);
        swaps.push(element);
    }

    console.log("Swap Requests:", swaps);

    return NextResponse.json(swaps,{status:200});

  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}