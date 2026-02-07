// src/lib/db/schema/moderatesCourseMaterials.js - ModeratesCourseMaterials table
import { pgTable, text, uuid, bigint, primaryKey } from 'drizzle-orm/pg-core';
import { courseMaterials } from './courseMaterials.js';
import { userinfo } from './userinfo.js';
import { modDecisionEnum } from './enums.js';

export const moderatesCourseMaterials = pgTable('moderatescoursematerials', {
  materialId: uuid('materialid').notNull().references(() => courseMaterials.materialId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatorEmail: text('moderatoremail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatedAt: bigint('moderatedat', { mode: 'number' }).notNull(),
  comment: text('comment').notNull(),
  decisionState: modDecisionEnum('decisionstate').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.materialId, table.moderatorEmail, table.moderatedAt] }),
}));
