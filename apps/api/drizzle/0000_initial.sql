-- Migration: 0000_initial.sql
-- Generated for Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'manager' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_admins_email` ON `admins` (`email`);

CREATE TABLE IF NOT EXISTS `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_categories_slug` ON `categories` (`slug`);
CREATE INDEX IF NOT EXISTS `idx_categories_display_order` ON `categories` (`display_order`);

CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text,
	`description` text,
	`price` integer NOT NULL,
	`compare_at_price` integer,
	`cost_price` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`is_featured` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_products_slug` ON `products` (`slug`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_products_sku` ON `products` (`sku`);
CREATE INDEX IF NOT EXISTS `idx_products_category` ON `products` (`category_id`);
CREATE INDEX IF NOT EXISTS `idx_products_active` ON `products` (`is_active`);
CREATE INDEX IF NOT EXISTS `idx_products_stock` ON `products` (`stock`);

CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`shipping_address` text NOT NULL,
	`city` text NOT NULL,
	`notes` text,
	`payment_method` text DEFAULT 'cod' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payment_trx_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping_cost` integer DEFAULT 0 NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_orders_status` ON `orders` (`status`);
CREATE INDEX IF NOT EXISTS `idx_orders_customer_phone` ON `orders` (`customer_phone`);
CREATE INDEX IF NOT EXISTS `idx_orders_created_at` ON `orders` (`created_at`);

CREATE TABLE IF NOT EXISTS `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_title` text NOT NULL,
	`product_sku` text,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);

CREATE INDEX IF NOT EXISTS `idx_order_items_order_id` ON `order_items` (`order_id`);
CREATE INDEX IF NOT EXISTS `idx_order_items_product_id` ON `order_items` (`product_id`);
