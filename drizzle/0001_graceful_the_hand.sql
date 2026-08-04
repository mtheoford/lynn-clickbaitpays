PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload_json` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`received_at` integer NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_stripe_events`(
	"id", "event_type", "status", "payload_json", "attempts", "received_at", "processed_at"
) SELECT
	"id", "event_type", 'completed', '{}', 1, "processed_at", "processed_at"
FROM `stripe_events`;--> statement-breakpoint
DROP TABLE `stripe_events`;--> statement-breakpoint
ALTER TABLE `__new_stripe_events` RENAME TO `stripe_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancel_at_period_end` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `users`
SET `phone` = '8017170563', `updated_at` = 1785772800000
WHERE `id` = 'user_lynn_theobald' AND `phone` = '80171705630';--> statement-breakpoint
UPDATE `sites`
SET `public_phone` = '8017170563', `updated_at` = 1785772800000
WHERE `id` = 'site_lynn_theobald' AND `public_phone` = '80171705630';
