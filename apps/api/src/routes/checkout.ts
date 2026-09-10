import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, inArray, sql } from "drizzle-orm";
import type { Bindings } from "../index";
import * as schema from "../db/schema";
import { kvRateLimiter } from "../middleware/rate-limiter";
import {
  sendTelegramOrderNotification,
  sendResendOrderEmail,
} from "../lib/notifications";

const checkoutRouter = new Hono<{ Bindings: Bindings }>();

// Zod Schema: Strict validation for customer checkout payload
const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().trim().min(7, "Phone number is too short"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  shippingAddress: z.string().trim().min(5, "Address must be at least 5 characters"),
  city: z.string().trim().min(2, "City is required"),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["cod", "bkash", "nagad", "rocket", "bank_transfer"]),
  paymentTrxId: z.string().trim().max(100).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "Cart cannot be empty"),
});

// Apply KV Rate Limiter: max 10 checkout attempts per minute per IP
checkoutRouter.use("/process", kvRateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: "rl:checkout" }));

checkoutRouter.post("/process", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const rawBody = await c.req.json().catch(() => null);

  // 1. Zod Input Validation
  const parseResult = checkoutSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return c.json(
      {
        error: "Validation Failed",
        details: parseResult.error.flatten().fieldErrors,
      },
      400
    );
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    city,
    notes,
    paymentMethod,
    paymentTrxId,
    items,
  } = parseResult.data;

  // 2. Fetch authoritative products from D1 to verify stock and calculate pricing server-side
  const productIds = items.map((i) => i.productId);
  const fetchedProducts = await db
    .select()
    .from(schema.products)
    .where(inArray(schema.products.id, productIds));

  const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

  // Check for missing or inactive items
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      return c.json(
        {
          error: "Product Unavailable",
          message: `Item with ID '${item.productId}' is no longer available.`,
        },
        400
      );
    }

    if (product.stock < item.quantity) {
      return c.json(
        {
          error: "Insufficient Stock",
          message: `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`,
          productId: product.id,
          availableStock: product.stock,
        },
        400
      );
    }
  }

  // 3. Compute Totals Server-Side (strictly in cents)
  let subtotal = 0;
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    return {
      id: `item_${crypto.randomUUID()}`,
      productId: product.id,
      productTitle: product.title,
      productSku: product.sku,
      unitPrice: product.price,
      quantity: item.quantity,
      totalPrice: lineTotal,
    };
  });

  const shippingCost = subtotal >= 10000 ? 0 : 500; // Free shipping over $100.00, otherwise $5.00
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  // Generate Human-Readable Order ID
  const orderDatePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  const orderId = `ORD-${orderDatePrefix}-${randomSuffix}`;
  const now = new Date();

  // 4. Atomic Execution via D1 Batch Transaction
  // We prepare atomic queries: decrement stock conditionally AND create the order records
  try {
    const batchStatements: any[] = [];

    // Statement A: Conditional stock decrement for each product
    for (const item of items) {
      batchStatements.push(
        db
          .update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}`,
            updatedAt: now,
          })
          .where(
            sql`${schema.products.id} = ${item.productId} AND ${schema.products.stock} >= ${item.quantity}`
          )
      );
    }

    // Statement B: Insert into Orders
    batchStatements.push(
      db.insert(schema.orders).values({
        id: orderId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        shippingAddress,
        city,
        notes: notes || null,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : (paymentTrxId ? "pending" : "pending"),
        paymentTrxId: paymentTrxId || null,
        status: "pending",
        subtotal,
        shippingCost,
        discount,
        total,
        createdAt: now,
        updatedAt: now,
      })
    );

    // Statement C: Insert Line Items
    for (const line of lineItems) {
      batchStatements.push(
        db.insert(schema.orderItems).values({
          id: line.id,
          orderId,
          productId: line.productId,
          productTitle: line.productTitle,
          productSku: line.productSku,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          totalPrice: line.totalPrice,
          createdAt: now,
        })
      );
    }

    // Execute atomic batch
    // In Drizzle D1, db.batch executes all statements in an atomic SQLite transaction
    // @ts-ignore
    await db.batch(batchStatements);

    // 5. Asynchronous Edge Notifications (Non-blocking using executionCtx.waitUntil)
    const notificationPayload = {
      order: {
        id: orderId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        shippingAddress,
        city,
        notes: notes || null,
        paymentMethod,
        paymentStatus: "pending" as const,
        paymentTrxId: paymentTrxId || null,
        status: "pending" as const,
        subtotal,
        shippingCost,
        discount,
        total,
        createdAt: now,
        updatedAt: now,
      },
      items: lineItems,
    };

    // Run notifications in edge background so client receives fast response
    c.executionCtx.waitUntil(
      Promise.allSettled([
        sendTelegramOrderNotification(
          notificationPayload,
          c.env.TELEGRAM_BOT_TOKEN,
          c.env.TELEGRAM_CHAT_ID
        ),
        sendResendOrderEmail(
          notificationPayload,
          c.env.RESEND_API_KEY
        ),
      ])
    );

    return c.json(
      {
        success: true,
        message: "Order placed successfully!",
        order: {
          id: orderId,
          total: total,
          subtotal: subtotal,
          shippingCost: shippingCost,
          paymentMethod,
          status: "pending",
          itemsCount: lineItems.length,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("[Checkout] Atomic transaction failed:", error);
    return c.json(
      {
        error: "Transaction Error",
        message: "Could not complete order checkout. Please verify item stock and try again.",
        details: error.message,
      },
      500
    );
  }
});

export { checkoutRouter };
