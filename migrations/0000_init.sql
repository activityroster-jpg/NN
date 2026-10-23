CREATE TABLE `admin_otp` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_otp_email_idx` ON `admin_otp` (`email`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_session` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`detail` text
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `booking` (
	`id` text PRIMARY KEY NOT NULL,
	`ref` text NOT NULL,
	`access_hash` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`provider_yacht_id` text NOT NULL,
	`provider_option_ref` text,
	`provider_booking_ref` text,
	`hold_expires_at` text,
	`operator_id` text NOT NULL,
	`operator_name` text NOT NULL,
	`destination_id` text NOT NULL,
	`yacht_snapshot` text NOT NULL,
	`quote_snapshot` text NOT NULL,
	`week_start` text NOT NULL,
	`week_end` text NOT NULL,
	`guests` integer NOT NULL,
	`skipper` text DEFAULT 'none' NOT NULL,
	`chef` text DEFAULT 'none' NOT NULL,
	`hostess` text DEFAULT 'none' NOT NULL,
	`lead_name` text NOT NULL,
	`lead_email` text NOT NULL,
	`lead_phone` text NOT NULL,
	`lead_country` text NOT NULL,
	`sailing_experience` text,
	`customer_notes` text,
	`currency` text NOT NULL,
	`total` real NOT NULL,
	`bank_total` real NOT NULL,
	`payment_method` text NOT NULL,
	`payout` real NOT NULL,
	`margin` real NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`admin_notes` text,
	`crew_member_ids` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_ref_uq` ON `booking` (`ref`);--> statement-breakpoint
CREATE INDEX `booking_status_idx` ON `booking` (`status`,`week_start`);--> statement-breakpoint
CREATE INDEX `booking_hold_idx` ON `booking` (`status`,`hold_expires_at`);--> statement-breakpoint
CREATE TABLE `crew_member` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text,
	`phone` text,
	`destinations` text NOT NULL,
	`weekly_cost` real,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `crew_rate` (
	`id` text PRIMARY KEY NOT NULL,
	`destination_id` text NOT NULL,
	`role` text NOT NULL,
	`weekly_price` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crew_rate_uq` ON `crew_rate` (`destination_id`,`role`);--> statement-breakpoint
CREATE TABLE `destination_setting` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`featured` integer,
	`sort_order` integer,
	`hero_image_url` text,
	`mode` text DEFAULT 'live' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enquiry` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`destination_id` text,
	`week_start` text,
	`guests` integer,
	`skipper` text,
	`chef` integer,
	`budget` text,
	`message` text,
	`yacht_key` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`source_path` text,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `enquiry_status_idx` ON `enquiry` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `fx_rate` (
	`currency` text PRIMARY KEY NOT NULL,
	`per_eur` real NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operator` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`parity_enforced` integer DEFAULT false NOT NULL,
	`commission_pct` real,
	`deposit_pct` real,
	`balance_days_before` integer,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`kind` text NOT NULL,
	`method` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_session_id` text,
	`stripe_payment_intent` text,
	`paid_at` text,
	`reminder_sent_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `payment_booking_idx` ON `payment` (`booking_id`);--> statement-breakpoint
CREATE INDEX `payment_due_idx` ON `payment` (`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `payout` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`payee` text NOT NULL,
	`payee_kind` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'due' NOT NULL,
	`paid_at` text,
	`reference` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `payout_due_idx` ON `payout` (`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `pricing_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`operator_id` text,
	`destination_id` text,
	`category_id` text,
	`markup_pct` real NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `provider_base` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text,
	`destination_id` text
);
--> statement-breakpoint
CREATE INDEX `provider_base_dest_idx` ON `provider_base` (`destination_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_event` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`received_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
