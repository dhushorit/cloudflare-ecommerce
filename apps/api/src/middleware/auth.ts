import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Bindings } from "../index";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: "superadmin" | "manager";
  exp: number;
}

export const adminAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: { admin: AdminJwtPayload };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", message: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || "fallback-insecure-secret-for-dev-change-in-prod";

  try {
    const payload = (await verify(token, jwtSecret, "HS256")) as unknown as AdminJwtPayload;
    if (!payload || !payload.sub) {
      return c.json({ error: "Unauthorized", message: "Malformed token payload" }, 401);
    }

    c.set("admin", payload);
    return next();
  } catch (err) {
    return c.json({ error: "Unauthorized", message: "Token is invalid or expired" }, 401);
  }
});
