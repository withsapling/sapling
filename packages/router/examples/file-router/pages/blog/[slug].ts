import { html } from "jsr:@sapling/sapling";
import BaseLayout from "../../layouts/BaseLayout.ts";
import NotFoundLayout from "../../layouts/NotFoundLayout.ts";
import { posts } from "./index.ts";

export default async function BlogPostPageTemplate(_: Request, params: { slug: string }) {

  // find the post with the matching slug
  const post = posts.find(p => p.slug === params.slug);
  // if the post is not found, return the 404 page
  if (!post) {
    return await NotFoundLayout({});
  }
  return await BaseLayout(
    {
      head: html`<title>${post.title}</title>`,
    },
    html`<h1 class="text-2xl font-bold">${post.title}</h1>
      <p class="mb-4">This is the first blog post.</p>
      <ul class="flex flex-col gap-2">
        <li><a class="text-blue-500 underline" href="/blog">Back to blog</a></li>
      </ul> `
  );
}
