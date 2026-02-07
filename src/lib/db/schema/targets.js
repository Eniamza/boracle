// src/lib/db/schema/targets.js - Targets table (for votes)
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const targets = pgTable('targets', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  refId: uuid('refid').notNull().unique(),
});
