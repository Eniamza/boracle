import { auth } from "@/auth";
import { sql } from "@/lib/pgdb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    //parse CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        {
          error: "CSV file must contain at least a header row and one data row",
        },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["facultyname", "email", "imgurl", "initials"];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header)
    );
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(", ")}` },
        { status: 400 }
      );
    }

    const results = {
      successCount: 0,
      errorCount: 0,
      totalCount: lines.length - 1,
      errors: [],
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const values = row.split(",").map((v) => v.trim());

      if (values.length !== headers.length) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          message: `Invalid number of columns. Expected ${headers.length}, got ${values.length}`,
        });
        continue;
      }

      // Create data object
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      // Validate data
      const validation = validateFacultyData(rowData, i + 1);
      if (!validation.valid) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          message: validation.message,
        });
        continue;
      }

      try {
        // Check if faculty already exists
        const existingFaculty = await sql`
          SELECT facultyID FROM faculty WHERE email = ${rowData.email}
        `;

        if (existingFaculty.length > 0) {
          results.errorCount++;
          results.errors.push({
            row: i + 1,
            message: `Faculty with email ${rowData.email} already exists`,
          });
          continue;
        }

        // Insert faculty
        const facultyResult = await sql`
          INSERT INTO faculty (facultyName, email, imgURL)
          VALUES (${rowData.facultyname}, ${rowData.email}, ${rowData.imgurl})
          RETURNING facultyID
        `;

        const facultyId = facultyResult[0].facultyid;

        // Insert initials if provided
        if (rowData.initials && rowData.initials.trim()) {
          const initials = rowData.initials
            .split(",")
            .map((init) => init.trim())
            .filter((init) => init);

          for (const initial of initials) {
            await sql`
              INSERT INTO initial (facultyID, facultyInitial)
              VALUES (${facultyId}, ${initial})
            `;
          }
        }

        results.successCount++;
      } catch (dbError) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          message: `Database error: ${dbError.message}`,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function validateFacultyData(data, rowNumber) {
  // Validate faculty name
  if (!data.facultyname || data.facultyname.trim().length === 0) {
    return { valid: false, message: "Faculty name is required" };
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    return { valid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, message: "Invalid email format" };
  }

  // Check if email ends with @g.bracu.ac.bd
  if (!data.email.endsWith("@g.bracu.ac.bd")) {
    return { valid: false, message: "Email must end with @g.bracu.ac.bd" };
  }

  // Validate image URL
  if (data.imgurl && data.imgurl.trim().length > 0) {
    try {
      const url = new URL(data.imgurl);
      if (url.protocol !== "https:") {
        return { valid: false, message: "Image URL must use HTTPS protocol" };
      }
    } catch {
      return { valid: false, message: "Invalid image URL format" };
    }
  }

  return { valid: true };
}
