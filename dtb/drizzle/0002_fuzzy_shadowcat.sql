CREATE TABLE `owner_attempts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`count` text NOT NULL,
	`window_start` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`media_type` text NOT NULL,
	`size` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL
);
