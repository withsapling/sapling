import { html, type HtmlContent, Layout } from "jsr:@sapling/sapling";

export default async function NotFoundLayout(options: {
  head?: HtmlContent;
  bodyClass?: string;
}) {
  return await Layout({
    head: options.head ?? html``,
    bodyClass: options.bodyClass ?? "",
    children: html`<main class="flex flex-col items-center justify-center h-screen">
      <h1 class="text-2xl font-bold">404 Not Found</h1>
      <p class="mb-4">The page you are looking for does not exist.</p>
      <a class="text-blue-500 underline" href="/">Go back to the home page</a>
    </main>`,
  });
}
