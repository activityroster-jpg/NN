CREATE TABLE `yacht_week_price` (
	`model_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`week_start` text NOT NULL,
	`price_eur` integer NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `yacht_week_price_pk` ON `yacht_week_price` (`model_id`,`destination_id`,`week_start`);--> statement-breakpoint
CREATE INDEX `yacht_week_price_dest_week_idx` ON `yacht_week_price` (`destination_id`,`week_start`);