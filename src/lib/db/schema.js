// src/lib/db/schema.js - Drizzle ORM Schema Definitions
import { pgTable, pgEnum, text, uuid, boolean, bigint, integer, primaryKey, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['student', 'admin', 'moderator']);

export const reviewStateEnum = pgEnum('review_state', ['pending', 'published', 'rejected']);

export const postStateEnum = pgEnum('post_state', ['pending', 'published', 'rejected']);

export const decisionEnum = pgEnum('decision', ['pending', 'published', 'rejected']);

export const modDecisionEnum = pgEnum('moddecision', ['pending', 'published', 'rejected']);

// ============ TABLES ============

// UserInfo table
export const userinfo = pgTable('userinfo', {
  email: text('email').primaryKey(),
  userName: text('username').notNull(),
  userRole: userRoleEnum('userrole').notNull().default('student'),
  createdAt: bigint('createdat', { mode: 'number' }),
});

// Faculty table
export const faculty = pgTable('faculty', {
  facultyId: uuid('facultyid').primaryKey().defaultRandom(),
  facultyName: text('facultyname').notNull(),
  email: text('email').notNull(),
  imgUrl: text('imgurl'),
});

// Initial (faculty initials) table
export const initial = pgTable('initial', {
  facultyId: uuid('facultyid').notNull().references(() => faculty.facultyId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  facultyInitial: text('facultyinitial').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.facultyId, table.facultyInitial] }),
  facultyIdIdx: index('idx_initial_faculty_id').on(table.facultyId),
}));

// SavedRoutine table
export const savedRoutine = pgTable('savedroutine', {
  routineId: uuid('routineid').primaryKey().defaultRandom(),
  routineStr: text('routinestr').notNull(),
  email: text('email').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: bigint('createdat', { mode: 'number' }),
  semester: text('semester').notNull(),
});

// CourseSwap table
export const courseSwap = pgTable('courseswap', {
  swapId: uuid('swapid').primaryKey().defaultRandom(),
  isDone: boolean('isdone').notNull().default(false),
  uEmail: text('uemail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  getSectionId: integer('getsectionid').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
  semester: text('semester'),
}, (table) => ({
  semesterFormatCheck: check('semester_uppercase_check', sql`${table.semester} ~ '^(SPRING|SUMMER|FALL)[0-9]{4}$'`),
}));

// AskSectionID table (many-to-many relationship for course swap)
export const askSectionId = pgTable('asksectionid', {
  swapId: uuid('swapid').notNull().references(() => courseSwap.swapId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  askSectionId: integer('asksectionid').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.swapId, table.askSectionId] }),
}));

// Reviews table
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

// CourseMaterials table
export const courseMaterials = pgTable('coursematerials', {
  materialId: uuid('materialid').primaryKey().defaultRandom(),
  uEmail: text('uemail').default('deleted@g.bracu.ac.bd').references(() => userinfo.email, { onDelete: 'set default', onUpdate: 'cascade' }),
  materialUrl: text('materialurl').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
  courseCode: text('coursecode').notNull(),
  semester: text('semester').notNull(),
  postState: postStateEnum('poststate').notNull().default('pending'),
  postDescription: text('postdescription').notNull(),
});

// Targets table (for votes)
export const targets = pgTable('targets', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  refId: uuid('refid').notNull().unique(),
});

// Votes table
export const votes = pgTable('votes', {
  uEmail: text('uemail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  targetUuid: uuid('targetuuid').notNull().references(() => targets.uuid, { onDelete: 'cascade', onUpdate: 'cascade' }),
  value: integer('value').notNull(),
  createdAt: bigint('createdat', { mode: 'number' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.uEmail, table.targetUuid] }),
}));

// ModeratesReview table
export const moderatesReview = pgTable('moderatesreview', {
  reviewId: uuid('reviewid').notNull().references(() => reviews.reviewId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatorEmail: text('moderatoremail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatedAt: bigint('moderatedat', { mode: 'number' }).notNull(),
  comment: text('comment').notNull(),
  decisionState: decisionEnum('decisionstate').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.reviewId, table.moderatorEmail, table.moderatedAt] }),
}));

// ModeratesCourseMaterials table
export const moderatesCourseMaterials = pgTable('moderatescoursematerials', {
  materialId: uuid('materialid').notNull().references(() => courseMaterials.materialId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatorEmail: text('moderatoremail').notNull().references(() => userinfo.email, { onDelete: 'cascade', onUpdate: 'cascade' }),
  moderatedAt: bigint('moderatedat', { mode: 'number' }).notNull(),
  comment: text('comment').notNull(),
  decisionState: modDecisionEnum('decisionstate').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.materialId, table.moderatorEmail, table.moderatedAt] }),
}));
