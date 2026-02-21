// src/lib/db/schema/swapRequest.js - SwapRequest table
import { pgTable, text, uuid, bigint, boolean } from 'drizzle-orm/pg-core';
import { userinfo } from './userinfo.js';
import { courseSwap } from './courseSwap.js';
import { swapRequestStatusEnum } from './enums.js';

export const swapRequest = pgTable('swaprequest', {
    requestId: uuid('requestid').primaryKey().defaultRandom(),
    swapId: uuid('swapid')
        .notNull()
        .references(() => courseSwap.swapId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    senderEmail: text('senderemail')
        .notNull()
        .references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
    receiverEmail: text('receiveremail')
        .notNull()
        .references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: swapRequestStatusEnum('status').notNull().default('PENDING'),
    isRead: boolean('isread').notNull().default(false),
    createdAt: bigint('createdat', { mode: 'number' }),
});
