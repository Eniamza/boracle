// src/lib/db/schema/savedMergedRoutine.js - SavedMergedRoutine table
import { pgTable, text, uuid, bigint, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userinfo } from './userinfo.js';

export const savedMergedRoutine = pgTable('savedmergedroutine', {
  routineId: uuid('routineid').primaryKey().defaultRandom(),
  routineData: text('routinedata').notNull(), // JSON string with format: [{ friendName: string, sectionIds: number[] }, ...]
  email: text('email').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: bigint('createdat', { mode: 'number' }),
  semester: text('semester').notNull(),
}, (table) => ({
  semesterFormatCheck: check('savedmergedroutine_semester_check', sql`${table.semester} ~ '^(SPRING|SUMMER|FALL)[0-9]{4}$'`),
}));
