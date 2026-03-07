// src/lib/db/schema/courseMaterials.js - CourseMaterials table
import { pgTable, text, uuid, bigint } from 'drizzle-orm/pg-core';
import { userinfo } from './userinfo.js';
import { postStateEnum } from './enums.js';

export const courseMaterials = pgTable('coursematerials', {
  materialId: uuid('materialid').primaryKey().defaultRandom(),
  uEmail: text('uemail').default('deleted@g.bracu.ac.bd').references(() => userinfo.email, { onDelete: 'set default', onUpdate: 'cascade' }),
  fileUuid: uuid('fileuuid').notNull().defaultRandom(),
  fileUrl: text('fileurl'), // Used for external links like YouTube or Google Drive
  fileExtension: text('fileextension').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
  courseCode: text('coursecode').notNull(),
  semester: text('semester').notNull(),
  postState: postStateEnum('poststate').notNull().default('pending'),
  postDescription: text('postdescription').notNull(),
});
