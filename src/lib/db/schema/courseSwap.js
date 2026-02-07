// src/lib/db/schema/courseSwap.js - CourseSwap table
import { pgTable, text, uuid, boolean, integer, bigint, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userinfo } from './userinfo.js';

export const courseSwap = pgTable('courseswap', {
  swapId: uuid('swapid').primaryKey().defaultRandom(),
  isDone: boolean('isdone').notNull().default(false),
  uEmail: text('uemail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  getSectionId: integer('getsectionid').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
  semester: text('semester'),
}, (table) => ({
  semesterFormatCheck: check('semester_uppercase_check', sql`${table.semester} ~ '^(SPRING|SUMMER|FALL)[0-9]{4}$'`),
}));
