// API to import faculty data from CSV - admin only
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { faculty, initial } from "@/lib/db/schema";
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
        .pipe(csv())
        .on("data", (data) => facultyData.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const facultyItem of facultyData) {
      const { facultyName, email, imgURL, initials: initialsStr } = facultyItem;
      if (!facultyName || !email) {
        return NextResponse.json(
          { error: "Faculty name and email are required" },
          { status: 400 }
        );
      }
      
      const result = await db
        .insert(faculty)
        .values({
          facultyName: facultyName,
          email: email,
          imgUrl: imgURL || null,
        })
        .returning({ facultyId: faculty.facultyId });

      const facultyId = result[0].facultyId;
      
      if (initialsStr) {
        const initialsArray = initialsStr.split(",").map(i => i.trim());
        for (const initialValue of initialsArray) {
          if (initialValue) {
            await db
              .insert(initial)
              .values({
                facultyId: facultyId,
                facultyInitial: initialValue,
              });
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