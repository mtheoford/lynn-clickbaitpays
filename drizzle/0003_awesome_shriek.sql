ALTER TABLE `sites` ADD `deletion_scheduled_at` integer;--> statement-breakpoint
CREATE INDEX `idx_sites_deletion_scheduled_at` ON `sites` (`deletion_scheduled_at`);