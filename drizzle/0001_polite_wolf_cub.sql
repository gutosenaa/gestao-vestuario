CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('estoque_zerado','estoque_baixo','margem_baixa','conta_vencida','produto_parado','meta_atingida') NOT NULL,
	`severity` enum('critico','atencao','informacao') NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`referenceType` varchar(40),
	`referenceId` int,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`beforeData` json,
	`afterData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dollarQuoteMicros` int NOT NULL DEFAULT 5600000,
	`minimumMarginBps` int NOT NULL DEFAULT 3000,
	`desiredMarginBps` int NOT NULL DEFAULT 5500,
	`salesTaxBps` int NOT NULL DEFAULT 0,
	`packagingCostCents` int NOT NULL DEFAULT 0,
	`reserveBps` int NOT NULL DEFAULT 500,
	`revenueGoalCents` int NOT NULL DEFAULT 1500000,
	`profitGoalCents` int NOT NULL DEFAULT 450000,
	`minimumStock` int NOT NULL DEFAULT 2,
	`idleDaysThreshold` int NOT NULL DEFAULT 60,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalogOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('time','liga','colecao','categoria','tamanho','cor','despesa') NOT NULL,
	`label` varchar(120) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalogOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(32),
	`whatsapp` varchar(32),
	`instagram` varchar(128),
	`email` varchar(320),
	`city` varchar(120),
	`notes` text,
	`status` enum('novo','recorrente','VIP','inativo') NOT NULL DEFAULT 'novo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dollarQuotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteMicros` int NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'manual',
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dollarQuotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`category` varchar(120) NOT NULL,
	`description` varchar(240) NOT NULL,
	`amountCents` int NOT NULL,
	`supplierId` int,
	`paymentMethodId` int,
	`status` enum('pendente','recebido','pago','vencido','cancelado') NOT NULL DEFAULT 'pendente',
	`dueDate` timestamp,
	`paidAt` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('receber','pagar') NOT NULL,
	`sourceType` varchar(40) NOT NULL,
	`sourceId` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`amountCents` int NOT NULL,
	`status` enum('pendente','recebido','pago','vencido','cancelado') NOT NULL DEFAULT 'pendente',
	`dueDate` timestamp,
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financialEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryLots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`purchaseItemId` int,
	`sourceType` varchar(40) NOT NULL DEFAULT 'compra',
	`receivedAt` timestamp NOT NULL,
	`initialQuantity` int NOT NULL,
	`availableQuantity` int NOT NULL,
	`unitCostCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryLots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`type` enum('compra','venda','devolucao','ajuste_entrada','ajuste_saida','perda','entrada_manual','saida_manual') NOT NULL,
	`quantity` int NOT NULL,
	`unitCostCents` int NOT NULL DEFAULT 0,
	`purchaseId` int,
	`saleId` int,
	`notes` text,
	`occurredAt` timestamp NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`feeBps` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentMethods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(180) NOT NULL,
	`team` varchar(120),
	`league` varchar(120),
	`collection` varchar(120),
	`category` varchar(120),
	`size` varchar(40),
	`predominantColor` varchar(120),
	`supplierId` int,
	`supplierUrl` varchar(500),
	`notes` text,
	`imageKey` varchar(512),
	`imageUrl` varchar(1024),
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`listPriceCents` int NOT NULL DEFAULT 0,
	`usdValueCents` int NOT NULL DEFAULT 0,
	`quoteMicros` int NOT NULL DEFAULT 0,
	`internationalShippingCents` int NOT NULL DEFAULT 0,
	`domesticShippingCents` int NOT NULL DEFAULT 0,
	`importFeesCents` int NOT NULL DEFAULT 0,
	`packagingCostCents` int NOT NULL DEFAULT 0,
	`otherCostsCents` int NOT NULL DEFAULT 0,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchaseItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitCostCents` int NOT NULL,
	`totalCostCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int,
	`purchaseDate` timestamp NOT NULL,
	`orderNumber` varchar(80),
	`shippingCents` int NOT NULL DEFAULT 0,
	`feesCents` int NOT NULL DEFAULT 0,
	`totalCents` int NOT NULL DEFAULT 0,
	`paymentMethodId` int,
	`paymentStatus` enum('pendente','recebido','pago','vencido','cancelado') NOT NULL DEFAULT 'pendente',
	`dueDate` timestamp,
	`paidAt` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saleChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`feeBps` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saleChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `saleChannels_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `saleItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceCents` int NOT NULL,
	`discountCents` int NOT NULL DEFAULT 0,
	`unitCostCents` int NOT NULL,
	`totalCostCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saleItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleNumber` varchar(24) NOT NULL,
	`soldAt` timestamp NOT NULL,
	`customerId` int,
	`saleChannelId` int,
	`paymentMethodId` int,
	`grossCents` int NOT NULL,
	`discountCents` int NOT NULL DEFAULT 0,
	`channelFeeCents` int NOT NULL DEFAULT 0,
	`paymentFeeCents` int NOT NULL DEFAULT 0,
	`taxCents` int NOT NULL DEFAULT 0,
	`costCents` int NOT NULL DEFAULT 0,
	`netCents` int NOT NULL,
	`profitCents` int NOT NULL,
	`paymentStatus` enum('pendente','recebido','pago','vencido','cancelado') NOT NULL DEFAULT 'recebido',
	`dueDate` timestamp,
	`receivedAt` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_number_unique` UNIQUE(`saleNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`company` varchar(160),
	`phone` varchar(32),
	`whatsapp` varchar(32),
	`country` varchar(80),
	`city` varchar(120),
	`websiteUrl` varchar(500),
	`sourceUrl` varchar(500),
	`notes` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','vendedor','financeiro','estoque') NOT NULL DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businessSettings` ADD CONSTRAINT `businessSettings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dollarQuotes` ADD CONSTRAINT `dollarQuotes_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_paymentMethodId_paymentMethods_id_fk` FOREIGN KEY (`paymentMethodId`) REFERENCES `paymentMethods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryLots` ADD CONSTRAINT `inventoryLots_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryLots` ADD CONSTRAINT `inventoryLots_purchaseItemId_purchaseItems_id_fk` FOREIGN KEY (`purchaseItemId`) REFERENCES `purchaseItems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD CONSTRAINT `inventoryMovements_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD CONSTRAINT `inventoryMovements_purchaseId_purchases_id_fk` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD CONSTRAINT `inventoryMovements_saleId_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD CONSTRAINT `inventoryMovements_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseItems` ADD CONSTRAINT `purchaseItems_purchaseId_purchases_id_fk` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseItems` ADD CONSTRAINT `purchaseItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_paymentMethodId_paymentMethods_id_fk` FOREIGN KEY (`paymentMethodId`) REFERENCES `paymentMethods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saleItems` ADD CONSTRAINT `saleItems_saleId_sales_id_fk` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saleItems` ADD CONSTRAINT `saleItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_saleChannelId_saleChannels_id_fk` FOREIGN KEY (`saleChannelId`) REFERENCES `saleChannels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_paymentMethodId_paymentMethods_id_fk` FOREIGN KEY (`paymentMethodId`) REFERENCES `paymentMethods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;