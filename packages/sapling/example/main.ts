import { Sapling, Layout, html, type Context } from "../src/index.ts";

const site = new Sapling();

// Regular layout example
site.get("/", async (c: Context) => {
  return c.html(
    await Layout({
      head: html`<title>Hello World</title>`,
      bodyClass: "bg-gray-100",
      children: html`<main class="min-h-screen flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold">Hello World</h1>
        <a href="/streamed" class="text-blue-500 hover:underline">View Streamed Version</a>
      </main>`,
    })
  );
});

async function fetchSlowData() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return html`<div class="mt-8 bg-red">This content was loaded after 2 seconds!</div>`;
}

// Streamed layout example
site.get("/streamed", async (c: Context) => {
  return c.html(
    await Layout({
      stream: true,
      head: html`<title>Hello World (Streamed)</title>`,
      bodyClass: "bg-gray-100",
      children: html`<main class="min-h-screen flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold">Hello World (Streamed)</h1>
      <a href="/" class="text-blue-500 hover:underline">View Regular Version</a>
      <div class="mt-8 text-red-500 bg-red-100 px-4 py-2 rounded-md">Hello</div>
      <div id="slow-data">
        <script>
          (async () => {
            const response = await fetch('/api/slow-data');
            const html = await response.text();
            document.getElementById('slow-data').innerHTML = html;
          })();
        </script>
        <div class="mt-8 text-gray-600">Loading...</div>
      </div>
    </main>`,
    })
  );
});

// API endpoint for slow data
site.get("/api/slow-data", async (c: Context) => {
  const slowData = await fetchSlowData();
  return c.html(String(slowData));
});

Deno.serve({
  port: 3000,
  onListen: () => {
    console.log("Server is running on http://localhost:3000");
  },
  handler: site.fetch,
});
