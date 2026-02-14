CREATE TABLE `action_items` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`project_id` text NOT NULL,
	`action` text NOT NULL,
	`owner` text,
	`due_date` integer,
	`status` text DEFAULT 'pending',
	`priority` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`transcript_id` text,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`input_type` text NOT NULL,
	`summary` text,
	`decisions_count` integer DEFAULT 0,
	`risks_count` integer DEFAULT 0,
	`blockers_count` integer DEFAULT 0,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`transcript_id`) REFERENCES `transcripts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_type` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`all_day` integer DEFAULT false,
	`location` text,
	`attendees` text,
	`related_analysis_id` text,
	`related_action_item_id` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`reminder_minutes` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_action_item_id`) REFERENCES `action_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`project_id` text NOT NULL,
	`decision` text NOT NULL,
	`owner` text,
	`rationale` text,
	`confidence` integer,
	`evidence` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`project_id` text NOT NULL,
	`risk` text NOT NULL,
	`likelihood` text,
	`impact` text,
	`severity` text NOT NULL,
	`owner` text,
	`mitigation` text,
	`confidence` integer,
	`evidence` text,
	`mentions` integer DEFAULT 1,
	`last_seen` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transcripts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`meeting_type` text,
	`file_name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);