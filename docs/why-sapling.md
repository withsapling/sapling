---
title: Why Sapling?
description: Learn why Sapling is the ideal choice for modern web development
publishedAt: "2024-01-01"
---

# Why Sapling?

Sapling was created with a simple goal: to make building modern server-side rendered (SSR) websites as straightforward as possible. While web development has grown increasingly complex, we believe that creating a website shouldn't require learning complex build tools or managing heavy client-side JavaScript.

## Core Principles

### 1. Zero JavaScript by Default

Sapling takes a HTML-first approach. Your pages are server-rendered and work without JavaScript enabled. This means:
- Better performance
- Improved accessibility
- Enhanced SEO
- Lower bandwidth usage

Add JavaScript only when you need it, not because your framework requires it.

### 2. No Build Step Required

Unlike many modern frameworks, Sapling doesn't require a build step in development:
- Start coding immediately
- Instant hot reloading
- No bundler configuration
- Native TypeScript support

### 3. Multi-Runtime Support

Sapling is designed to work across different JavaScript runtimes:
- **Deno**: For modern, secure applications
- **Node.js**: For traditional Node.js environments
- **Bun**: For maximum performance

Choose the runtime that best fits your needs without changing your code.

### 4. Built-in Tailwind

Sapling uses [UnoCSS](https://github.com/unocss/unocss) for CSS, which means you can use just about any Tailwind classes and they will just work. We even include the Tailwind reset styles by default so it feels like you're using Tailwind out of the box.

### 5. Simple but Powerful

Sapling provides powerful features without complexity:
- File-based routing
- Type-safe templating
- Built-in UnoCSS support
- Markdown processing
- Layout system

## When to Use Sapling

Sapling is ideal for:

- **Content-focused websites**: Blogs, documentation, marketing sites
- **Server-rendered applications**: Where SEO and initial load performance are crucial
- **Multi-page applications**: Traditional website structures with multiple pages
- **API-driven websites**: You want to serve a few webpages from your API instead of setting up an entirely new frontend project

## When to Consider Alternatives

Sapling might not be the best choice for:

- Single-page applications (SPAs) with complex client-side state
- Applications requiring real-time updates
- Projects that need extensive client-side JavaScript

## Performance Benefits

### Server-Side Rendering
- Faster Time to First Byte (TTFB)
- Better Core Web Vitals
- Reduced client-side processing

### Minimal JavaScript
- Smaller bundle sizes
- Less parsing and execution time
- Reduced memory usage

### Efficient Asset Handling
- Built-in static file serving
- Automatic HTTP caching headers
- Optimized asset loading

## Developer Experience

Sapling prioritizes developer experience:

```typescript
// Simple component creation
function Greeting() {
  return html`
    <div class="greeting">
      <h1>Hello, World!</h1>
    </div>
  `;
}

// Easy routing
site.get("/", async (c) => c.html(await Home()));

// Straightforward layouts
export default async function Layout(props: LayoutProps) {
  return await SaplingLayout({
    title: "My Site",
    children: props.children
  });
}
```

## Modern Features

Despite its simplicity, Sapling includes modern features:

- **TypeScript First**: Full type safety out of the box
- **UnoCSS Integration**: Modern atomic CSS
- **Dark Mode Support**: Built-in dark mode utilities
- **API Routes**: Easy backend functionality
- **Markdown Support**: A first party markdown to HTML implementation with syntax highlighting

## Community and Ecosystem

Sapling benefits from:
- Regular updates and improvements
- Growing ecosystem of plugins and tools
- Comprehensive documentation

## Getting Started

Ready to try Sapling? Check out our Quick Start guides:
- [Quick Start (Deno)](/docs/quick-start-deno)
- [Quick Start (Node.js)](/docs/quick-start-node) 