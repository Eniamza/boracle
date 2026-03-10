// Delete all course swaps (cascades to swapRequest and askSectionId)
// Run with: node src/scripts/deleteAllSwaps.js

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { courseSwap } from '../lib/db/schema/courseSwap.js';

const client = postgres(
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    { max: 1 }
);

const db = drizzle(client);

async function deleteAllSwaps() {
    const deleted = await db.delete(courseSwap).returning({ id: courseSwap.swapId });
    console.log(`✅ Deleted ${deleted.length} swap(s) (cascaded to swap requests & ask section IDs)`);
    await client.end();
}

deleteAllSwaps().catch((err) => {
    console.error('❌ Failed to delete swaps:', err.message);
    process.exit(1);
});
