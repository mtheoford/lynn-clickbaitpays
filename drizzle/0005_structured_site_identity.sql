ALTER TABLE `users` ADD `first_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_name` text;--> statement-breakpoint
ALTER TABLE `sites` ADD `company_name` text;--> statement-breakpoint
ALTER TABLE `sites` ADD `display_name_type` text DEFAULT 'personal' NOT NULL;
