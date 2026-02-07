// src/lib/db/schema/faculty.js - Faculty table
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const faculty = pgTable('faculty', {
  facultyId: uuid('facultyid').primaryKey().defaultRandom(),
  facultyName: text('facultyname').notNull(),
  email: text('email').notNull(),
  imgUrl: text('imgurl'),
});
