ALTER TABLE `sites` ADD `is_demo` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `users`
SET
	`email` = 'demo@proneurs.org',
	`name` = 'Your Name',
	`phone` = '0000000000',
	`updated_at` = unixepoch('now') * 1000
WHERE `id` = 'user_lynn_theobald';--> statement-breakpoint
UPDATE `sites`
SET
	`slug` = 'your-name',
	`display_name` = 'Your Name',
	`initials` = 'YN',
	`public_email` = 'demo@proneurs.org',
	`public_phone` = '0000000000',
	`show_email` = 0,
	`show_phone` = 0,
	`bio` = 'Your introduction will appear here, giving visitors a clear and welcoming way to learn about ClickBaitPays with you.',
	`referral_url` = 'https://clickbaitpays.me/',
	`is_demo` = 1,
	`updated_at` = unixepoch('now') * 1000
WHERE `id` = 'site_lynn_theobald';
