CREATE TABLE `photo_cache` (
	`query` text PRIMARY KEY NOT NULL,
	`hits` text NOT NULL,
	`fetched_at` text NOT NULL
);
