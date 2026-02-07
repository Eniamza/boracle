// src/lib/db/schema/moderatesReview.js - ModeratesReview table
import { pgTable, text, uuid, bigint, primaryKey } from 'drizzle-orm/pg-core';
import { reviews } from './reviews.js';
import { userinfo } from './userinfo.js';
import { decisionEnum } from './enums.js';

export const moderatesReview = pgTable('moderatesreview', {
  reviewId: uuid('reviewid').notNull().references(() => reviews.reviewId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatorEmail: text('moderatoremail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatedAt: bigint('moderatedat', { mode: 'number' }).notNull(),
  comment: text('comment').notNull(),
  decisionState: decisionEnum('decisionstate').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.reviewId, table.moderatorEmail, table.moderatedAt] }),
}));
