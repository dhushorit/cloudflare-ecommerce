import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import type { Bindings } from "../index";
import * as schema from "../db/schema";
import { verifyPassword } from "../lib/crypto";
import { adminAuth, AdminJwtPayload } from "../middleware/auth";
import { uploadToR2, getR2PublicUrl } from "../lib/r2";

const adminRouter = new Hono<{
  Bindings: Bindings;
  Variables: { admin: AdminJwtPayload };
}>();

// ============================================================================
// AUTHENTICATION
// ============================================================================
adminRouter.post("/login", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json().catch(() => null);

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid credentials format" }, 400);
  }

  const { email, password } = parsed.data;
  const admin = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.email, email))
    .get();

  if (!admin) {
    return c.json({ error: "Unauthorized", message: "Invalid email or password" }, 401);
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return c.json({ error: "Unauthorized", message: "Invalid email or password" }, 401);
  }

  const jwtSecret = c.env.JWT_SECRET || "fallback-insecure-secret-for-dev-change-in-prod";
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days

  const token = await sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      exp,
    },
    jwtSecret,
    "HS256"
  );

  return c.json({
    success: true,
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// All following routes require Bearer JWT token
adminRouter.use("/*", adminAuth);

adminRouter.get("/me", async (c) => {
  const adminInfo = c.get("admin");
  return c.json({ admin: adminInfo });
});

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================
adminRouter.get("/products", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const productList = await db.query.products.findMany({
    orderBy: [desc(schema.products.createdAt)],
    with: {
      category: true,
    },
  });

  return c.json({ data: productList });
});

const productSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative(), // in cents
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  costPrice: z.number().int().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

adminRouter.post("/products", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json().catch(() => null);

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation Error", details: parsed.error.flatten() }, 400);
  }

  const id = `prod_${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(schema.products).values({
    id,
    ...parsed.data,
    compareAtPrice: parsed.data.compareAtPrice ?? null,
    costPrice: parsed.data.costPrice ?? null,
    sku: parsed.data.sku ?? null,
    description: parsed.data.description ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

adminRouter.put("/products/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation Error", details: parsed.error.flatten() }, 400);
  }

  await db
    .update(schema.products)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(schema.products.id, id));

  return c.json({ success: true });
});

adminRouter.delete("/products/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param("id");

  await db.delete(schema.products).where(eq(schema.products.id, id));
  return c.json({ success: true });
});

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================
adminRouter.get("/categories", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const categories = await db
    .select()
    .from(schema.categories)
    .orderBy(schema.categories.displayOrder);

  return c.json({ data: categories });
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

adminRouter.post("/categories", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json().catch(() => null);

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation Error", details: parsed.error.flatten() }, 400);
  }

  const id = `cat_${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(schema.categories).values({
    id,
    ...parsed.data,
    description: parsed.data.description ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================
adminRouter.get("/orders", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const ordersList = await db.query.orders.findMany({
    orderBy: [desc(schema.orders.createdAt)],
    with: {
      items: true,
    },
    limit: 100,
  });

  return c.json({ data: ordersList });
});

adminRouter.patch("/orders/:id/status", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const statusSchema = z.object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
    paymentStatus: z.enum(["pending", "verified", "failed", "refunded"]).optional(),
  });

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation Error", details: parsed.error.flatten() }, 400);
  }

  await db
    .update(schema.orders)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, id));

  return c.json({ success: true });
});

// ============================================================================
// BANGLADESH COURIER DISPATCH ENGINE
// ============================================================================
adminRouter.post("/orders/:id/courier", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
  });

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  const { provider = "steadfast", note, credentials } = body;

  const { bookCourierParcel } = await import("../lib/courier");
  const result = await bookCourierParcel({
    provider,
    orderId: order.id,
    recipientName: order.customerName,
    recipientPhone: order.customerPhone,
    recipientAddress: order.shippingAddress,
    recipientCity: order.city,
    codAmount: order.paymentMethod === "cod" ? order.total : 0, // 0 if already paid via bkash/nagad
    note,
    credentials,
  });

  // Update order in D1 with tracking consignment and update status to shipped
  await db
    .update(schema.orders)
    .set({
      courierName: result.provider,
      courierConsignmentId: result.consignmentId,
      courierTrackingUrl: result.trackingUrl,
      status: "shipped",
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, id));

  return c.json({
    success: true,
    result,
    updatedOrder: {
      id: order.id,
      courierName: result.provider,
      consignmentId: result.consignmentId,
      trackingUrl: result.trackingUrl,
      status: "shipped",
    },
  });
});

// ============================================================================
// DIRECT R2 MEDIA UPLOAD
// ============================================================================
adminRouter.post("/upload", async (c) => {
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ error: "R2 Storage binding not configured" }, 500);
  }

  const formData = await c.req.formData().catch(() => null);
  if (!formData) {
    return c.json({ error: "Multipart form data expected" }, 400);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return c.json({ error: "File field is required" }, 400);
  }

  const blob = file as File;
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  if (!allowedMimeTypes.includes(blob.type)) {
    return c.json({ error: "Unsupported image format. Allowed: JPG, PNG, WEBP, AVIF, GIF" }, 400);
  }

  const extension = blob.name.split(".").pop() || "webp";
  const key = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const arrayBuffer = await blob.arrayBuffer();

  await uploadToR2(bucket, key, arrayBuffer, blob.type);
  const publicUrl = getR2PublicUrl(c.env, key);

  return c.json({
    success: true,
    key,
    url: publicUrl,
  });
});

// ============================================================================
// EDGE SYSTEM TEST & DIAGNOSTICS
// ============================================================================
adminRouter.post("/test-telegram", async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  const chatId = c.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return c.json(
      {
        error: "Configuration Missing",
        message: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret is not set yet in Cloudflare.",
      },
      400
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "⚡ <b>AuraStore Test Alert</b>\nYour Cloudflare Worker edge notification pipeline is active and healthy!",
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return c.json({ error: "Telegram API Error", details: errTxt }, 502);
    }

    return c.json({ success: true, message: "Test notification dispatched to Telegram!" });
  } catch (err: any) {
    return c.json({ error: "Network Error", message: err.message }, 500);
  }
});

export { adminRouter };
