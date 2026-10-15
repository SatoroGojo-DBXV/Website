CREATE TABLE `assignments` (
	`request_id` text PRIMARY KEY NOT NULL,
	`tutor_user_id` text NOT NULL,
	`stage` text NOT NULL,
	`owner_note` text NOT NULL,
	`schedule` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inbox` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_user_id` text NOT NULL,
	`from_owner` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reward_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`details` text NOT NULL,
	`status` text NOT NULL,
	`points` text NOT NULL,
	`owner_note` text NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE TABLE `reward_members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`referred_by` text,
	`created_at` text NOT NULL
);
