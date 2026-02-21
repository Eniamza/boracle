// src/lib/db/schema/enums.js - Drizzle ORM Enum Definitions
import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['student', 'admin', 'moderator']);

export const reviewStateEnum = pgEnum('review_state', ['pending', 'published', 'rejected']);

export const postStateEnum = pgEnum('post_state', ['pending', 'published', 'rejected']);

export const decisionEnum = pgEnum('decision', ['pending', 'published', 'rejected']);

export const modDecisionEnum = pgEnum('moddecision_state', ['APPROVED', 'REJECTED', 'PENDING']);
export const swapRequestStatusEnum = pgEnum('swaprequest_status', ['PENDING', 'ACCEPTED', 'REJECTED']);
