// src/lib/db/schema/userinfo.js - UserInfo table
import { pgTable, text, bigint } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.js';

export const userinfo = pgTable('userinfo', {
  email: text('email').primaryKey(),
  userName: text('username').notNull(),
  userRole: userRoleEnum('userrole').notNull().default('student'),
  createdAt: bigint('createdat', { mode: 'number' }),
});
