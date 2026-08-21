// API for deleting ALL swaps - admin only
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { courseSwap } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();

  if (!session || session.user?.userrole !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const deleted = await db
    .delete(courseSwap)
    .returning({ swapId: courseSwap.swapId });

  return NextResponse.json({
    success: true,
    message: `Deleted ${deleted.length} swap(s)`,
    deletedCount: deleted.length,
  });
}
