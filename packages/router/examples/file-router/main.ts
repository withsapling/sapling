import { Layout, html } from "jsr:@sapling/sapling";
import { FileRouter, render, serveStatic } from "../../src/index.ts";

const router = new FileRouter({
  directory: "./pages",
  baseUrl: import.meta.url,
});

// This sets up the file based routes
await router.initialize();

/**
 * This is a simple api route that returns the request body as a json response
 * Because we're using the same router base class for both the file based routes and the api routes
 * we can define the api routes after the file based routes have been initialized
 */
router.post("/api/joke", async (req) => {
  const request = await req.json();
  return new Response(JSON.stringify(request));
});

// Serve static files
// The location of this is important. It should be the last route you define before the 404 handler.
router.get("/*", serveStatic({
  directory: "./static",
}));

// Set a custom 404 handler. Important: This should be the last route you define.
router.setNotFoundHandler(async () => {
  return render(
    await Layout({
      children: html`<h1>404 Not Found</h1>`,
    }),
  );
});

Deno.serve({
  port: 8080,
  onListen: () => console.log("Server is running on http://localhost:8080"),
  handler: router.fetch,
});