// API to import faculty data from CSV - admin only
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { faculty, initial } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";

export async function POST(request) {
  // Check if the user is authenticated and has admin role
  const session = await auth();
  console.log("Admin Import Faculty API accessed by:", session);
  console.log("User role:", session?.user?.userrole);
  if (!session || session.user?.userrole !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { file } = await request.json();
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    const facultyData = [];
    const stream = Readable.from([file]);
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          separator: ",",
          quote: '"',
          escape: '"',
          mapHeaders: ({ header }) => header.trim(),
        }))
        .on("data", (data) => facultyData.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const facultyItem of facultyData) {
      const { facultyName, email, imgURL, initials: initialsStr } = facultyItem;

      if (!facultyName || !email) {
        // Skip invalid rows or handle error? 
        // Original code returned 400 immediately on first error. let's keep that behavior or log error?
        // Original: return NextResponse.json(...)
        return NextResponse.json(
          { error: "Faculty name and email are required" },
          { status: 400 }
        );
      }

      // Check if faculty exists
      const existingFaculty = await db.query.faculty.findFirst({
        where: eq(faculty.email, email),
      });

      let facultyId;

      if (existingFaculty) {
        facultyId = existingFaculty.facultyId;
        const updateData = {};

        // Update imgUrl if missing in DB but present in CSV
        if (!existingFaculty.imgUrl && imgURL) {
          updateData.imgUrl = imgURL;
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(faculty)
            .set(updateData)
            .where(eq(faculty.facultyId, facultyId));
        }

        if (initialsStr) {
          // We want to add any initials from the CSV that are NOT in the database.
          // Since we use onConflictDoNothing below, we can simply attempt to insert all unique initials from the CSV.
          // This satisfies "check if uploaded CSV has data database does not have".

          const initialsArray = [
            ...new Set(initialsStr.split(",").map((i) => i.trim())),
          ]; // Deduplicate

          for (const initialValue of initialsArray) {
            if (initialValue) {
              await db
                .insert(initial)
                .values({
                  facultyId: facultyId,
                  facultyInitial: initialValue,
                })
                .onConflictDoNothing();
            }
          }
        }
      } else {
        // Insert new faculty
        const result = await db
          .insert(faculty)
          .values({
            facultyName: facultyName,
            email: email,
            imgUrl: imgURL || null,
          })
          .returning({ facultyId: faculty.facultyId });

        facultyId = result[0].facultyId;

        if (initialsStr) {
          const initialsArray = [
            ...new Set(initialsStr.split(",").map((i) => i.trim())),
          ]; // Deduplicate
          for (const initialValue of initialsArray) {
            if (initialValue) {
              await db
                .insert(initial)
                .values({
                  facultyId: facultyId,
                  facultyInitial: initialValue,
                })
                .onConflictDoNothing();
            }
          }
        }
      }
    }

    return NextResponse.json(
      { message: "Faculty data imported successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error importing faculty data:", error);
    return NextResponse.json(
      { error: "Failed to import faculty data" },
      { status: 500 }
    );
  }
}