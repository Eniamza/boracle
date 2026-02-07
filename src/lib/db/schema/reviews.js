// src/lib/db/schema/reviews.js - Reviews table
import { pgTable, text, uuid, boolean, integer, bigint } from 'drizzle-orm/pg-core';
import { faculty } from './faculty.js';
import { userinfo } from './userinfo.js';
import { reviewStateEnum } from './enums.js';

export const reviews = pgTable('reviews', {
  reviewId: uuid('reviewid').primaryKey().defaultRandom(),
  facultyId: uuid('facultyid').notNull().references(() => faculty.facultyId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  uEmail: text('uemail').notNull().default('deleted@g.bracu.ac.bd').references(() => userinfo.email, { onDelete: 'set default', onUpdate: 'cascade' }),
  isAnon: boolean('isanon').notNull().default(false),
  semester: text('semester').notNull(),
  behaviourRating: integer('behaviourrating').notNull(),
  teachingRating: integer('teachingrating').notNull(),
  markingRating: integer('markingrating').notNull(),
  section: text('section').notNull(),
  courseCode: text('coursecode').notNull(),
  reviewDescription: text('reviewdescription'),
  postState: reviewStateEnum('poststate').notNull().default('pending'),
  createdAt: bigint('createdat', { mode: 'number' }),
});
