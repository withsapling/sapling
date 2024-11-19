import { html } from "jsr:@sapling/sapling";
import BaseLayout from "../../../layouts/BaseLayout.ts";

export default async function Index() {
  return await BaseLayout({},
    html`<main>
      <h1 class="text-2xl font-bold">Hey</h1>
      <p class="mb-4">This is the hey page at <code class="font-mono bg-gray-100 p-1 rounded-md">/level-one/level-two/hey</code></p>
      <ul class="flex flex-col gap-2">
        <li><a class="text-blue-500 underline" href="/level-one/level-two">Back To Level Two</a></li>
        <li><a class="text-blue-500 underline" href="/">Back To Home</a></li>
      </ul>
    </main>`,
  );
}
