CREATE TABLE `studio_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`customerName` varchar(120) NOT NULL,
	`customerPhone` varchar(24) NOT NULL,
	`notes` text,
	`scheduledAt` timestamp NOT NULL,
	`studio_booking_status` enum('requested','confirmed','completed','cancelled') NOT NULL DEFAULT 'requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studio_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `studio_services_slug_unique` UNIQUE(`slug`)
);
