import { Hono } from "hono";
import { cors } from "hono/cors";
import { storefrontRouter } from "./routes/storefront";
import { checkoutRouter } from "./routes/checkout";
import { adminRouter } from "./routes/admin";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN: string;
  R2_PUBLIC_DOMAIN: string;
  JWT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ----------------------------------------------------------------------------
// Global Middleware: Dynamic CORS & Security Headers
// ----------------------------------------------------------------------------
app.use("*", async (c, next) => {
  const allowedOrigin = c.env.ALLOWED_ORIGIN || "*";
  return cors({
    origin: allowedOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400,
  })(c, next);
});

// ----------------------------------------------------------------------------
// Root & Health Endpoints
// ----------------------------------------------------------------------------
app.get("/", (c) => {
  return c.json({
    name: "Cloudflare Edge Commerce API",
    status: "running",
    version: "1.0.0",
    docs: {
      health: "/health",
      products: "/api/products",
      categories: "/api/categories",
      checkout: "POST /api/checkout/process",
      orderTrack: "/api/orders/track?orderId=...&phone=...",
      adminLogin: "POST /api/admin/login",
    },
    storefrontUrl: "http://localhost:5173",
  });
});

app.get("/health", async (c) => {
  return c.json({
    status: "ok",
    environment: c.env.ENVIRONMENT || "development",
    timestamp: Date.now(),
    bindings: {
      db: !!c.env.DB,
      r2: !!c.env.BUCKET,
      kv: !!c.env.KV,
    },
  });
});

// ----------------------------------------------------------------------------
// Mount Core Routers
// ----------------------------------------------------------------------------
app.route("/api/checkout", checkoutRouter);
app.route("/api/admin", adminRouter);
app.route("/api", storefrontRouter);

// ----------------------------------------------------------------------------
// Global Error & 404 Handlers
// ----------------------------------------------------------------------------
app.notFound((c) => {
  return c.json({ error: "Not Found", message: `Cannot ${c.req.method} ${c.req.path}` }, 404);
});

app.onError((err, c) => {
  console.error("[Worker Error]", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred on the edge.",
    },
    500
  );
});

export default app;
