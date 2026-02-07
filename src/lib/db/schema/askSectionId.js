// src/lib/db/schema/askSectionId.js - AskSectionID table (many-to-many for course swap)
import { pgTable, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { courseSwap } from './courseSwap.js';

export const askSectionId = pgTable('asksectionid', {
  swapId: uuid('swapid').notNull().references(() => courseSwap.swapId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  askSectionId: integer('asksectionid').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.swapId, table.askSectionId] }),
}));
