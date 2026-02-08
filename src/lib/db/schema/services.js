// src/lib/db/schema/services.js - Services table schema
import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  message: varchar('message', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
