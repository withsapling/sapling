[![JSR](https://jsr.io/badges/@sapling/sapling)](https://jsr.io/@sapling/sapling)

# Sapling

A simpler SSR and API framework built on top of web standards. Sapling provides an intuitive way to build server-side rendered applications and APIs using modern JavaScript/TypeScript.

## Features

- **Web Standards First**: Built on native Web APIs and standards like `URLPattern`
- **Simple & Intuitive API**: Express-like routing with modern conveniences
- **Zero Configuration**: Works out of the box with sensible defaults
- **Built-in Layout System**: Includes UnoCSS support and optional Tailwind reset
- **Full SSR Support**: Server-side rendering of HTML and atomic CSS
- **Type-Safe**: Written in TypeScript with full type support
- **Middleware Support**: Easy to extend and customize
- **Modern Form Handling**: Built-in support for JSON and FormData
- **Static Site Generation**: Built-in support for prerendering routes

## Documentation

- [Website](https://sapling.land)
- [Documentation](https://sapling.land/docs)

## Installation

Deno

```bash
# Install from JSR
deno add jsr:@sapling/sapling
```

Node

```bash
# Install from JSR
npx jsr add @sapling/sapling
```

## Quick Start

```typescript
import { Sapling } from "@sapling/sapling";

const site = new Sapling();

// Basic route
site.get("/", (c) => {
  return c.html("<h1>Hello World!</h1>");
});

// JSON API endpoint
site.post("/api/users", async (c) => {
  const data = await c.req.json<{ name: string }>();
  return c.json({ created: data.name });
});

// URL parameters
site.get("/users/:id", (c) => {
  const userId = c.req.param("id");
  return c.text(`User ID: ${userId}`);
});

// Query parameters
site.get("/search", (c) => {
  const query = c.req.query("q");
  return c.text(`Search query: ${query}`);
});
```

## Layout System

Sapling includes a powerful layout system with built-in Tailwind CSS via [UnoCSS](https://unocss.dev/):

```typescript
import { Layout } from "@sapling/sapling";

site.get("/", async (c) => {
  const content = await Layout({
    head: "<title>My App</title>",
    bodyClass: "bg-gray-100",
    children: "<h1 class='text-2xl'>Welcome!</h1>"
  });
  
  return c.html(content);
});
```

## API Reference

### Routing

```typescript
site.get(path, handler)    // Handle GET requests
site.post(path, handler)   // Handle POST requests
site.put(path, handler)    // Handle PUT requests
site.delete(path, handler) // Handle DELETE requests
site.patch(path, handler)  // Handle PATCH requests
```

### Context Methods

Request Methods:
- `c.req.json<T>()` - Parse JSON request body
- `c.req.formData()` - Parse form data
- `c.req.text()` - Get request body as text
- `c.req.param(name?)` - Access URL parameters
- `c.req.query(name?)` - Access query parameters
- `c.req.header(name)` - Get request header

Response Methods:
- `c.json(data, status?)` - Send JSON response
- `c.html(content)` - Send HTML response
- `c.text(content, status?)` - Send text response
- `c.redirect(url, status?)` - Redirect response

State Management:
- `c.set(key, value)` - Set state value
- `c.get(key)` - Get state value

### Middleware Support

```typescript
// Global middleware
site.use(async (c, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  console.log(`Request took ${duration}ms`);
  return response;
});

// Route-specific middleware
site.get("/protected",
  async (c, next) => {
    if (!isAuthenticated(c)) {
      return c.redirect("/login");
    }
    return next();
  },
  (c) => {
    return c.html("<h1>Protected Content</h1>");
  }
);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
