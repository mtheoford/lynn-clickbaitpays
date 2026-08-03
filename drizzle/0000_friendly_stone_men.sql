CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`event_type` text NOT NULL,
	`referrer_host` text,
	`visitor_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_site_created` ON `analytics_events` (`site_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_type_created` ON `analytics_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_target` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_sessions_hash_unique` ON `customer_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_customer_sessions_user_id` ON `customer_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_customer_sessions_expires_at` ON `customer_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_magic_link_tokens_hash_unique` ON `magic_link_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_magic_link_tokens_user_id` ON `magic_link_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_magic_link_tokens_expires_at` ON `magic_link_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`initials` text NOT NULL,
	`public_email` text NOT NULL,
	`public_phone` text NOT NULL,
	`show_email` integer DEFAULT true NOT NULL,
	`show_phone` integer DEFAULT true NOT NULL,
	`bio` text NOT NULL,
	`referral_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source_site_id` text,
	`stripe_checkout_session_id` text,
	`published_at` integer,
	`reservation_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sites_slug_unique` ON `sites` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sites_checkout_session_unique` ON `sites` (`stripe_checkout_session_id`);--> statement-breakpoint
CREATE INDEX `idx_sites_user_id` ON `sites` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sites_status` ON `sites` (`status`);--> statement-breakpoint
CREATE INDEX `idx_sites_source_site_id` ON `sites` (`source_site_id`);--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`site_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	`grace_ends_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_subscriptions_stripe_subscription_unique` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_id` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_site_id` ON `subscriptions` (`site_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_stripe_customer` ON `subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_status` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`stripe_customer_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_stripe_customer_unique` ON `users` (`stripe_customer_id`);--> statement-breakpoint
INSERT INTO `users` (
	`id`, `email`, `name`, `phone`, `created_at`, `updated_at`
) VALUES (
	'user_lynn_theobald',
	'lynntheo@gmail.com',
	'Lynn Theobald',
	'80171705630',
	1785772800000,
	1785772800000
);--> statement-breakpoint
INSERT INTO `sites` (
	`id`, `user_id`, `slug`, `display_name`, `initials`, `public_email`,
	`public_phone`, `show_email`, `show_phone`, `bio`, `referral_url`,
	`status`, `published_at`, `created_at`, `updated_at`
) VALUES (
	'site_lynn_theobald',
	'user_lynn_theobald',
	'lynn-theobald',
	'Lynn Theobald',
	'LT',
	'lynntheo@gmail.com',
	'80171705630',
	1,
	1,
	'Questions before joining? Lynn is here to help you find the facts and take the next step with confidence.',
	'https://clickbaitpays.me/?ref=thinleo',
	'active',
	1785772800000,
	1785772800000,
	1785772800000
);
