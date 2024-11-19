import { Layout, html } from "jsr:@sapling/sapling";
import { Router, render } from "jsr:@sapling/router";

const router = new Router();

router.get("/", async () => {
  return render(
    await Layout({
      children: html`
        <main class="max-w-screen-lg min-h-screen mx-auto px-4 py-16 flex flex-col items-center justify-center font-sans">
          <h1 class="text-4xl font-bold">Hello World</h1>
        </main>
      `,
    }),
  );
});

// Set a custom 404 handler. Important: This should be the last route you define.
router.setNotFoundHandler(async () => {
  return render(
    await Layout({
      children: html`
        <main class="max-w-screen-lg min-h-screen mx-auto px-4 py-16 flex flex-col items-center justify-center font-sans">
          <h1 class="text-4xl font-bold">404 Not Found</h1>
        </main>
      `,
    }),
  );
});

Deno.serve({
  port: 8080,
  onListen: () => console.log("Server is running on http://localhost:8080"),
  handler: router.fetch,
});