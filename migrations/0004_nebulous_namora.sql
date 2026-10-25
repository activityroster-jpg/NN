CREATE TABLE `social_account` (
	`provider` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`access_token` text NOT NULL,
	`expires_at` text NOT NULL,
	`refreshed_at` text,
	`connected_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`connected_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_post` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'instagram' NOT NULL,
	`image_key` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`note` text,
	`caption_source` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`scheduled_at` text NOT NULL,
	`posted_at` text,
	`remote_id` text,
	`permalink` text,
	`error` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_post_due_idx` ON `social_post` (`status`,`scheduled_at`);