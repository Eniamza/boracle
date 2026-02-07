// src/lib/db/schema/votes.js - Votes table
import { pgTable, text, uuid, integer, bigint, primaryKey } from 'drizzle-orm/pg-core';
import { userinfo } from './userinfo.js';
import { targets } from './targets.js';

export const votes = pgTable('votes', {
  uEmail: text('uemail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  targetUuid: uuid('targetuuid').notNull().references(() => targets.uuid, { onDelete: 'cascade', onUpdate: 'cascade' }),
  value: integer('value').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.uEmail, table.targetUuid] }),
}));
