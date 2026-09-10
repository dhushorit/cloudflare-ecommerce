import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, like, desc, sql } from "drizzle-orm";
import type { Bindings } from "../index";
import * as schema from "../db/schema";
import { getFromR2 } from "../lib/r2";

const storefrontRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/categories - Active categories list
storefrontRouter.get("/categories", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.isActive, true))
    .orderBy(schema.categories.displayOrder);

  return c.json({ data: categories });
});

// GET /api/products - Catalog query with filtering, search, and pagination
storefrontRouter.get("/products", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const categorySlug = c.req.query("category");
  const searchQuery = c.req.query("q")?.trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.products.isActive, true)];

  if (categorySlug) {
    const category = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.slug, categorySlug))
      .get();

    if (category) {
      conditions.push(eq(schema.products.categoryId, category.id));
    }
  }

  if (searchQuery) {
    conditions.push(like(schema.products.title, `%${searchQuery}%`));
  }

  const productsList = await db
    .select()
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(desc(schema.products.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: productsList,
    pagination: {
      page,
      limit,
    },
  });
});

// GET /api/products/:slug - Product details with category info
storefrontRouter.get("/products/:slug", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const slug = c.req.param("slug");

  const product = await db.query.products.findFirst({
    where: and(eq(schema.products.slug, slug), eq(schema.products.isActive, true)),
    with: {
      category: true,
    },
  });

  if (!product) {
    return c.json({ error: "Product Not Found" }, 404);
  }

  return c.json({ data: product });
});

// GET /api/orders/track - Track order by Order ID and Customer Phone
storefrontRouter.get("/orders/track", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const orderId = c.req.query("orderId")?.trim();
  const phone = c.req.query("phone")?.trim();

  if (!orderId || !phone) {
    return c.json(
      { error: "Validation Error", message: "Both orderId and phone parameters are required." },
      400
    );
  }

  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.id, orderId),
      eq(schema.orders.customerPhone, phone)
    ),
    with: {
      items: true,
    },
  });

  if (!order) {
    return c.json({ error: "Order Not Found", message: "No order matched the provided credentials." }, 404);
  }

  return c.json({ data: order });
});

// GET /api/media/:key - Proxy delivery of R2 media assets if custom R2 domain is not bound
storefrontRouter.get("/media/:key", async (c) => {
  const key = c.req.param("key");
  const bucket = c.env.BUCKET;
  if (!bucket) {
    return c.json({ error: "Storage not configured" }, 500);
  }

  const object = await getFromR2(bucket, key);
  if (!object) {
    return c.json({ error: "Asset not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

export { storefrontRouter };
