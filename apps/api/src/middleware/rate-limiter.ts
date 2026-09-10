import { createMiddleware } from "hono/factory";
import type { Bindings } from "../index";

interface RateLimitConfig {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

/**
 * Cloudflare KV-based sliding/fixed-window rate limiter middleware.
 * Uses client IP (cf-connecting-ip) to count requests in a specified time window.
 */
export function kvRateLimiter(config: RateLimitConfig = {}) {
  const windowSeconds = config.windowSeconds || 60;
  const maxRequests = config.maxRequests || 20;
  const keyPrefix = config.keyPrefix || "rl";

  return createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
    const kv = c.env.KV;
    if (!kv) {
      // If KV binding is missing (e.g. initial dev test), allow request
      return next();
    }

    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for") ||
      "127.0.0.1";

    const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
    const cacheKey = `${keyPrefix}:${ip}:${currentWindow}`;

    const rawCount = await kv.get(cacheKey);
    const count = rawCount ? parseInt(rawCount, 10) : 0;

    if (count >= maxRequests) {
      c.header("Retry-After", windowSeconds.toString());
      return c.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please retry in ${windowSeconds} seconds.`,
        },
        429
      );
    }

    // Increment count with TTL matching the window
    await kv.put(cacheKey, (count + 1).toString(), {
      expirationTtl: windowSeconds * 2,
    });

    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, maxRequests - (count + 1)).toString());

    return next();
  });
}
