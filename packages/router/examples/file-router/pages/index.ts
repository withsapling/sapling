import { html } from "jsr:@sapling/sapling";
import BaseLayout from "../layouts/BaseLayout.ts";

export default async function Index() {
  return await BaseLayout({
    head: html`<title>Home</title>`,
  },
    html`<main class="flex flex-col items-center justify-center h-screen">
      <h1 class="text-2xl font-bold">Home</h1>
      <p class="mb-4">This is the home page.</p>
      <ul class="flex flex-col gap-2">
        <li><a class="text-blue-500 underline" href="/level-one">Level One</a></li>
        <li><a class="text-blue-500 underline" href="/blog">Blog</a></li>
      </ul>
    </main>`,
  );
}


