import { sql, relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// 1. ADMINS / USERS TABLE
// ============================================================================
export const admins = sqliteTable(
  "admins",
  {
    id: text("id").primaryKey(), // crypto.randomUUID()
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["superadmin", "manager"] })
      .notNull()
      .default("manager"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("idx_admins_email").on(table.email),
  ]
);

// ============================================================================
// 2. CATEGORIES TABLE
// ============================================================================
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("idx_categories_slug").on(table.slug),
    index("idx_categories_display_order").on(table.displayOrder),
  ]
);

// ============================================================================
// 3. PRODUCTS TABLE
// ============================================================================
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    sku: text("sku"),
    description: text("description"),
    // Prices stored in cents/smallest currency unit to eliminate floating-point rounding
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"), // Original strikethrough price
    costPrice: integer("cost_price"), // Internal cost for margin analysis
    stock: integer("stock").notNull().default(0), // Atomic checks applied during checkout
    images: text("images", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`), // Array of R2 storage keys / URLs
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("idx_products_slug").on(table.slug),
    uniqueIndex("idx_products_sku").on(table.sku),
    index("idx_products_category").on(table.categoryId),
    index("idx_products_active").on(table.isActive),
    index("idx_products_stock").on(table.stock),
  ]
);

// ============================================================================
// 4. ORDERS TABLE
// ============================================================================
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(), // E.g., "ORD-202609-XXXX"
    // Customer Contact & Shipping Details
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: text("shipping_address").notNull(),
    city: text("city").notNull(),
    notes: text("notes"),

    // Payment Info (optimized for Cash On Delivery and Manual Mobile Banking)
    paymentMethod: text("payment_method", {
      enum: ["cod", "bkash", "nagad", "rocket", "bank_transfer"],
    }).notNull().default("cod"),
    paymentStatus: text("payment_status", {
      enum: ["pending", "verified", "failed", "refunded"],
    }).notNull().default("pending"),
    paymentTrxId: text("payment_trx_id"), // Transaction ID submitted by customer for mobile banking

    // Courier Integration (Steadfast, Pathao, RedX, Paperfly)
    courierName: text("courier_name"),
    courierConsignmentId: text("courier_consignment_id"),
    courierTrackingUrl: text("courier_tracking_url"),

    // Fulfillment Status
    status: text("status", {
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    }).notNull().default("pending"),

    // Financial calculations (in cents)
    subtotal: integer("subtotal").notNull(),
    shippingCost: integer("shipping_cost").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("idx_orders_status").on(table.status),
    index("idx_orders_customer_phone").on(table.customerPhone),
    index("idx_orders_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// 5. ORDER ITEMS TABLE (Atomic Line Items)
// ============================================================================
export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Snapshot fields preserved at moment of transaction
    productTitle: text("product_title").notNull(),
    productSku: text("product_sku"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: integer("total_price").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
    index("idx_order_items_product_id").on(table.productId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Export inferred TypeScript types
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
