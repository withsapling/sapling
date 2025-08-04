import "dotenv/config";
import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { auth, authMiddleware, optionalAuthMiddleware } from "./auth/index.js";

const app = new Hono();

// Mount auth routes
app.route('/auth', auth);

// API endpoint to get current user info (requires auth)
app.get("/api/user", authMiddleware, (c: Context) => {
  const user = c.get('user');
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }
  });
});

// API endpoint to check auth status (optional auth)
app.get("/api/status", optionalAuthMiddleware, (c: Context) => {
  const user = c.get('user');
  return c.json({
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    } : null
  });
});

// Health check endpoint
app.get("/health", (c: Context) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 Handler
app.notFound((c: Context) => c.json({ error: "Not found" }, 404));

const port = 8080;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

