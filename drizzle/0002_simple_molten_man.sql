CREATE TABLE `productVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`size` varchar(40),
	`color` varchar(120),
	`sku` varchar(48),
	`imageUrl` varchar(1024),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productVariants_id` PRIMARY KEY(`id`),
	CONSTRAINT `productVariants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('Admin','Vendedor','Financeiro','Estoque') NOT NULL DEFAULT 'Admin';--> statement-breakpoint
ALTER TABLE `productVariants` ADD CONSTRAINT `productVariants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;