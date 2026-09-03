CREATE TABLE `signup_page_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`placement` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`source` text,
	`referrer_host` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signup_page_events_created` ON `signup_page_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_signup_page_events_type_created` ON `signup_page_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_signup_page_events_visitor_created` ON `signup_page_events` (`visitor_hash`,`created_at`);
