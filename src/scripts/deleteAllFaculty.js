// Delete all faculty data (cascades to initials, reviews, etc.)
// Run with: node src/scripts/deleteAllFaculty.js

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { faculty } from '../lib/db/schema/faculty.js';

const client = postgres(
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    { max: 1 }
);

const db = drizzle(client);

async function deleteAllFaculty() {
    const deleted = await db.delete(faculty).returning({ id: faculty.facultyId });
    console.log(`✅ Deleted ${deleted.length} faculty record(s) (cascaded to initials & reviews)`);
    await client.end();
}

deleteAllFaculty().catch((err) => {
    console.error('❌ Failed to delete faculty:', err.message);
    process.exit(1);
});
