import "dotenv/config";
import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import NotFoundLayout from "./layouts/NotFoundLayout.js";
import { Home } from "./pages/Home.js";
import { LoginPage } from "./pages/Login.js";
import { auth, authMiddleware, optionalAuthMiddleware } from "./auth/index.js";

const app = new Hono();

// Mount auth routes
app.route('/auth', auth);

// Custom logout route that redirects to login
app.post('/auth/logout', async (c: Context) => {
  const { getCookie, deleteCookie } = await import('hono/cookie');
  const refreshToken = getCookie(c, 'refresh_token');
  
  if (refreshToken) {
    // Revoke refresh token in database
    try {
      const { createDatabaseAdapter } = await import('./auth/database-adapter.js');
      const db = createDatabaseAdapter();
      await db.revokeRefreshToken(refreshToken);
    } catch (error) {
      console.error('Error revoking refresh token:', error);
    }
  }

  // Delete cookies
  deleteCookie(c, 'auth_token');
  deleteCookie(c, 'refresh_token');
  
  // Set cache control headers to prevent browser caching
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  
  return c.redirect('/login');
});

// Login page (redirect if already authenticated)
app.get("/login", optionalAuthMiddleware, (c: Context) => {
  const user = c.get('user');
  if (user) {
    return c.redirect('/');
  }
  return c.html(<LoginPage />);
});

// Dashboard redirect (fallback for auth library)
app.get("/dashboard", (c: Context) => c.redirect('/'));

// Home page (requires auth)
app.get("/", authMiddleware, (c: Context) => {
  const user = c.get('user');
  // Additional cache prevention headers
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  return c.html(<Home user={user} />);
});

// Enter additional routes here

// Serve static files
// The location of this is important. It should be the last route you define.
app.get("*", serveStatic({ root: "./static" }));

// 404 Handler
app.notFound((c: Context) => c.html(<NotFoundLayout />));

const port = 8080;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

