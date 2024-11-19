import { html } from "jsr:@sapling/sapling";
import BaseLayout from "../../layouts/BaseLayout.ts";

// this is a fake database of blog posts it could be replaced with markdown files or an api call
export const posts = [
  {
    slug: "post-1",
    title: "Blog Post 1",
  },
  {
    slug: "post-2",
    title: "Blog Post 2",
  },
];

export default async function Index() {
  return await BaseLayout({},
    html`<main>
      <h1 class="text-2xl font-bold">Blog</h1>
      <p class="mb-4">This is the blog page.</p>
      <ul class="flex flex-col gap-2">
      ${posts.map(post => html`<li><a class="text-blue-500 underline" href="/blog/${post.slug}">${post.title}</a></li>`)}
      <li><a class="text-blue-500 underline" href="/blog/post-3">Go To Post That Does Not Exist</a></li>
      <li><a class="text-blue-500 underline" href="/">Home</a></li>
      </ul>
    </main>`,
  );
}
