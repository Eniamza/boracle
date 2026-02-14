// src/lib/db/schema/savedRoutine.js - SavedRoutine table
import { pgTable, text, uuid, bigint, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userinfo } from './userinfo.js';

export const savedRoutine = pgTable('savedroutine', {
  routineId: uuid('routineid').primaryKey().defaultRandom(),
  routineStr: text('routinestr').notNull(),
  routineName: text('routinename'),
  email: text('email').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: bigint('createdat', { mode: 'number' }),
  semester: text('semester').notNull(),
}, (table) => ({
  semesterFormatCheck: check('savedroutine_semester_check', sql`${table.semester} ~ '^(SPRING|SUMMER|FALL)[0-9]{4}$'`),
}));
