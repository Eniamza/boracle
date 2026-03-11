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

    let imported = 0;
    let updated = 0;

    for (const facultyItem of facultyData) {
      const { facultyName, email, imgURL, initials: initialsStr } = facultyItem;

      if (!facultyName || !email) {
        return NextResponse.json(
          { error: "Faculty name and email are required" },
          { status: 400 }
        );
      }

      // Upsert faculty: insert or update on email conflict
      const updateFields = { facultyName };
      if (imgURL) {
        updateFields.imgUrl = imgURL;
      }

      const [upsertedFaculty] = await db
        .insert(faculty)
        .values({
          facultyName,
          email,
          imgUrl: imgURL || null,
        })
        .onConflictDoUpdate({
          target: faculty.email,
          set: updateFields,
        })
        .returning({ facultyId: faculty.facultyId });

      const facultyId = upsertedFaculty.facultyId;

      // Insert any new initials (composite PK prevents duplicates)
      if (initialsStr) {
        const initialsArray = [
          ...new Set(initialsStr.split(",").map((i) => i.trim()).filter(Boolean)),
        ];

        for (const initialValue of initialsArray) {
          await db
            .insert(initial)
            .values({
              facultyId,
              facultyInitial: initialValue,
            })
            .onConflictDoNothing();
        }
      }
    }

    return NextResponse.json(
      { message: `Faculty data imported successfully. ${facultyData.length} rows processed.` },
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