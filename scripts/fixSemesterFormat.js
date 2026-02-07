// scripts/fixSemesterFormat.js - One-time migration to fix semester format
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const sql = postgres(connectionString, { ssl: 'require' });

async function fixSemesterFormat() {
  try {
    // First check what semesters exist
    const existing = await sql`SELECT DISTINCT semester FROM savedroutine`;
    console.log('Existing semester values:', existing);

    // Update semesters to uppercase format with 4-digit year
    // Handle formats like: "Spring 2025", "spring2025", "SPRING 2025", etc.
    const result = await sql`
      UPDATE savedroutine
      SET semester = UPPER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(semester, '\\s+', ''),  -- Remove spaces
          '(SPRING|SUMMER|FALL)(\\d{2})$',       -- Handle 2-digit year at end
          '\\120\\2',                             -- Prepend '20' to 2-digit years
          'i'
        )
      )
      WHERE semester !~ '^(SPRING|SUMMER|FALL)[0-9]{4}$'
    `;
    
    console.log('Updated rows:', result.count);

    // Verify the update
    const updated = await sql`SELECT DISTINCT semester FROM savedroutine`;
    console.log('Updated semester values:', updated);

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sql.end();
  }
}

fixSemesterFormat();
