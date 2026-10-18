import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const registrations = sqliteTable('registrations', { id: text('id').primaryKey(), userId: text('user_id').notNull(), role: text('role').notNull(), payload: text('payload').notNull(), status: text('status').notNull(), updatedAt: text('updated_at').notNull() });
export const trialRequests = sqliteTable('trial_requests', { id: text('id').primaryKey(), userId: text('user_id').notNull(), subject: text('subject').notNull(), mode: text('mode').notNull(), availability: text('availability').notNull(), notes: text('notes').notNull(), status: text('status').notNull(), createdAt: text('created_at').notNull() });

export const assignments = sqliteTable('assignments', {
 requestId: text('request_id').primaryKey(), tutorUserId: text('tutor_user_id').notNull(),
 stage: text('stage').notNull(), ownerNote: text('owner_note').notNull(), schedule: text('schedule').notNull(), updatedAt: text('updated_at').notNull()
});
export const inbox = sqliteTable('inbox', {
 id: text('id').primaryKey(), threadUserId: text('thread_user_id').notNull(), fromOwner: text('from_owner').notNull(), body: text('body').notNull(), createdAt: text('created_at').notNull()
});
export const rewardMembers = sqliteTable('reward_members', {
 userId: text('user_id').primaryKey(), code: text('code').notNull(), referredBy: text('referred_by'), createdAt: text('created_at').notNull()
});
export const rewardClaims = sqliteTable('reward_claims', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(), kind: text('kind').notNull(), details: text('details').notNull(), status: text('status').notNull(), points: text('points').notNull(), ownerNote: text('owner_note').notNull(), createdAt: text('created_at').notNull(), reviewedAt: text('reviewed_at')
});
export const tutorDocuments = sqliteTable('tutor_documents', {
 id:text('id').primaryKey(),userId:text('user_id').notNull(),kind:text('kind').notNull(),fileName:text('file_name').notNull(),mediaType:text('media_type').notNull(),size:text('size').notNull(),objectKey:text('object_key').notNull(),createdAt:text('created_at').notNull()
});
export const ownerAttempts=sqliteTable('owner_attempts', {userId:text('user_id').primaryKey(),count:text('count').notNull(),windowStart:text('window_start').notNull()});
export const ownerEmails=sqliteTable('owner_emails',{email:text('email').primaryKey(),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull()});
