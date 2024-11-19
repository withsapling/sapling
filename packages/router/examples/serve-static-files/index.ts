import { Layout, html } from "jsr:@sapling/sapling";
import { Router, render, serveStatic } from "jsr:@sapling/router";

const router = new Router();

router.get("/", async () => {
  return render(
    await Layout({
      head: html`
        <!-- This is served from the static directory -->
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
      `,
      children: html`
        <main class="max-w-screen-lg min-h-screen mx-auto px-4 py-16 flex flex-col items-center justify-center font-sans">
          <h1 class="text-4xl font-bold">Hello World</h1>
        </main>
      `,
    }),
  );
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