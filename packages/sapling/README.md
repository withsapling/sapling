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
  const data = await c.jsonData<{ name: string }>();
  return c.json({ created: data.name });
});

// URL parameters
site.get("/users/:id", (c) => {
  const userId = c.req.param("id");
  return c.text(`User ID: ${userId}`);
});
```

## Layout System

Sapling includes a powerful layout system with built-in UnoCSS support:

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

- `c.json(data)` - Send JSON response
- `c.html(content)` - Send HTML response
- `c.text(content)` - Send text response
- `c.redirect(url, status?)` - Redirect response
- `c.jsonData<T>()` - Parse JSON request body
- `c.formData()` - Parse form data
- `c.query()` - Access query parameters
- `c.req.param(name)` - Access URL parameters

### Layout Options

```typescript
interface LayoutProps {
  unoConfig?: UserConfig;        // Custom UnoCSS configuration
  disableTailwindReset?: boolean; // Disable default Tailwind reset
  head?: string;                 // Additional head content
  bodyClass?: string;            // Body element classes
  children: string;              // Page content
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
