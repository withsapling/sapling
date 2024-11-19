import { html, type HtmlContent, Layout } from "jsr:@sapling/sapling";

export default async function BaseLayout(options: {
  head?: HtmlContent;
  bodyClass?: string;
}, children: HtmlContent) {
  return await Layout({
    head: html`
      <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    `,
    bodyClass: options.bodyClass ?? "",
    children: html`<main class="flex flex-col items-center justify-center h-screen">
      ${children}
    </main>`,
  });
}
