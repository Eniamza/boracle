// src/lib/db/schema/initial.js - Faculty Initials table
import { pgTable, text, uuid, primaryKey, index } from 'drizzle-orm/pg-core';
import { faculty } from './faculty.js';

export const initial = pgTable('initial', {
  facultyId: uuid('facultyid').notNull().references(() => faculty.facultyId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  facultyInitial: text('facultyinitial').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.facultyId, table.facultyInitial] }),
  facultyIdIdx: index('idx_initial_faculty_id').on(table.facultyId),
}));
