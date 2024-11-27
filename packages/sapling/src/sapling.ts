// load urlpattern-polyfill if not supported in the run time such as Node.js
// @ts-ignore: Property 'URLPattern' does not exist 
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

/**
 * Context object passed to route handlers
 * @example
 * ```ts
 * site.get("/users/:id", async (c: Context) => {
 *   // Access URL parameters
 *   const userId = c.req.param("id");
 *   
 *   // Access query parameters
 *   const sort = c.query().get("sort");
 *   
 *   // Parse JSON body
 *   const body = await c.json<{ name: string }>();
 *   
 *   // Use shared state
 *   c.state.user = await getUser(userId);
 * });
 * ```
 * 
 * @example
 * ```ts
 * site.get("/", (c) => {
 *   return c.json({ message: "Hello, world!" });
 * });
 * ```
 */
export interface Context {
  /** The original request object */
  req: {
    param: (name: string) => string;
    method: string;
    url: string;
    headers: Headers;
  };
  /** Shared state object for passing data between middleware */
  state: Record<string, unknown>;

  /**
   * Get URL query parameters
   * @returns URLSearchParams object containing query parameters
   */
  query(): URLSearchParams;

  /**
   * Parse request body as JSON
   * @template T - The expected type of the JSON data
   * @returns Promise resolving to the parsed JSON data
   * @example
   * ```ts
   * site.post("/api/users", async (c) => {
   *   const data = await c.jsonData<{ name: string }>();
   *   return c.json({ created: data.name });
   * });
   * ```
   */
  jsonData<T>(): Promise<T>;

  /**
   * Send JSON response
   * @example
   * ```ts
   * site.get("/api/user", (c) => {
   *   return c.json({ name: "John", age: 30 });
   * });
   * ```
   */
  json(data: unknown): Response;

  /**
   * Get form data from request
   * @returns Promise resolving to FormData object
   */
  formData(): Promise<FormData>;

  /**
   * Render HTML response
   * @example
   * ```ts
   * site.get("/", (c) => {
   *   return c.html("<h1>Hello World</h1>");
   * });
   * ```
   */
  html(content: string): Response;

  /**
   * Send text response
   * @example
   * ```ts
   * site.get("/text", (c) => {
   *   return c.text("Hello World");
   * });
   * ```
   */
  text(content: string): Response;

  /**
   * Redirect to another URL
   * @param location - URL to redirect to
   * @param status - HTTP status code (default: 302)
   * @example
   * ```ts
   * site.get("/old-page", (c) => {
   *   return c.redirect("/new-page");
   * });
   * 
   * site.get("/permanent-redirect", (c) => {
   *   return c.redirect("/new-location", 301);
   * });
   * ```
   */
  redirect(location: string, status?: number): Response;
}

/** Handler function type for processing requests */
type ContextHandler = (c: Context) => Response | Promise<Response | null> | null;

/** Internal route configuration */
type Route = {
  pattern: URLPattern;
  handler: ContextHandler;
};

/**
 * Sapling class for handling HTTP requests
 * @example
 * ```ts
 * const site = new Sapling();
 * 
 * // Basic route
 * site.get("/", (c) => {
 *   return new Response("Hello World!");
 * });
 * 
 * // Route with parameters
 * site.get("/users/:id", (c) => {
 *   const userId = c.params.id;
 *   return new Response(`User ${userId}`);
 * });
 * 
 * // Handle POST with JSON body
 * site.post("/api/users", async (c) => {
 *   const data = await c.json<{ name: string }>();
 *   return new Response(`Created user: ${data.name}`);
 * });
 * 
 * // Custom 404 handler
 * site.setNotFoundHandler((c) => {
 *   return new Response("Custom Not Found", { status: 404 });
 * });
 * ```
 */
export class Sapling {
  private routes: Map<string, Route[]> = new Map();
  private notFoundHandler: ContextHandler = () =>
    new Response("Not found", { status: 404 });

  constructor() {
    ["GET", "POST", "PUT", "DELETE", "PATCH"].forEach((method) => {
      this.routes.set(method, []);
    });
  }

  /**
   * Add a route handler for a specific HTTP method and path
   * @param method - HTTP method
   * @param path - URL pattern to match
   * @param handler - Function to handle matching requests
   */
  private add(method: string, path: string, handler: ContextHandler): Sapling {
    const patterns = [
      new URLPattern({ pathname: path }),
      new URLPattern({ pathname: path.endsWith('/') ? path : path + '/' })
    ];

    const routes = this.routes.get(method);
    patterns.forEach(pattern => {
      routes?.push({ pattern, handler });
    });

    return this;
  }

  /**
   * Add a GET route handler
   * @example
   * ```ts
   * // Basic route
   * site.get("/hello", (c) => {
   *   return new Response("Hello World!");
   * });
   * 
   * // Route with URL parameters
   * site.get("/users/:id/posts/:postId", (c) => {
   *   const { id, postId } = c.params;
   *   return new Response(`User ${id}, Post ${postId}`);
   * });
   * 
   * // Using query parameters
   * site.get("/search", (c) => {
   *   const query = c.query().get("q");
   *   return new Response(`Search: ${query}`);
   * });
   * ```
   */
  get(path: string, handler: ContextHandler): Sapling {
    return this.add("GET", path, handler);
  }

  /**
   * Add a POST route handler
   * @example
   * ```ts
   * // Handle JSON body
   * site.post("/api/users", async (c) => {
   *   const user = await c.json<{ name: string; email: string }>();
   *   return new Response(`Created user: ${user.name}`);
   * });
   * 
   * // Handle form data
   * site.post("/upload", async (c) => {
   *   const form = await c.formData();
   *   const file = form.get("file");
   *   return new Response(`Uploaded: ${file.name}`);
   * });
   * ```
   */
  post(path: string, handler: ContextHandler): Sapling {
    return this.add("POST", path, handler);
  }

  /**
   * Add a PUT route handler
   * @param path - URL pattern to match
   * @param handler - Function to handle matching requests
   */
  put(path: string, handler: ContextHandler): Sapling {
    return this.add("PUT", path, handler);
  }

  /**
   * Add a DELETE route handler
   * @param path - URL pattern to match
   * @param handler - Function to handle matching requests
   */
  delete(path: string, handler: ContextHandler): Sapling {
    return this.add("DELETE", path, handler);
  }

  /**
   * Add a PATCH route handler
   * @param path - URL pattern to match
   * @param handler - Function to handle matching requests
   */
  patch(path: string, handler: ContextHandler): Sapling {
    return this.add("PATCH", path, handler);
  }

  /**
   * Set custom handler for 404 Not Found responses
   * @example
   * ```ts
   * site.setNotFoundHandler((c) => {
   *   // Return custom 404 page
   *   return new Response("Custom Not Found Page", {
   *     status: 404,
   *     headers: { "Content-Type": "text/html" }
   *   });
   * });
   * ```
   */
  setNotFoundHandler(handler: ContextHandler): Sapling {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Handle incoming fetch requests
   * @param req - Request object
   */
  fetch = async (req: Request): Promise<Response> => {
    const response = await this.handle(req);
    const context = this.createContext(req, {});
    const notFoundResponse = await this.notFoundHandler(context);
    return response ?? notFoundResponse ?? new Response("Not found", { status: 404 });
  };

  /**
   * Create a new context object for a request
   * @param req - Request object
   * @param params - URL parameters
   */
  private createContext(req: Request, params: Record<string, string>): Context {
    return {
      req: {
        param: (name: string) => params[name] || '',
        method: req.method,
        url: req.url,
        headers: req.headers,
        // Add other request methods as needed
      },
      state: {},
      query: () => new URL(req.url).searchParams,
      jsonData: async <T>() => await req.clone().json() as T,
      formData: async () => await req.clone().formData(),
      html: (content: string) => new Response(content, {
        headers: { "content-type": "text/html; charset=UTF-8" }
      }),
      json: (data: unknown) => new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" }
      }),
      text: (content: string) => new Response(content, {
        headers: { "content-type": "text/plain; charset=UTF-8" }
      }),
      redirect: (location: string, status = 302) => new Response(null, {
        status,
        headers: { Location: location }
      })
    };
  }

  /**
   * Handle a request and find matching route
   * @param req - Request object
   */
  async handle(req: Request): Promise<Response | null> {
    const method = req.method;
    const url = req.url;

    const routes = this.routes.get(method);
    if (!routes) {
      return new Response("Method not allowed", { status: 405 });
    }

    for (const route of routes) {
      const match = route.pattern.exec(url);
      if (match) {
        const groups = match.pathname.groups as Record<string, string | undefined>;
        const params = Object.fromEntries(
          Object.entries(groups).filter(([_, v]) => v !== undefined),
        ) as Record<string, string>;

        const context = this.createContext(req, params);
        const response = await route.handler(context);
        if (response === null) continue;
        return response;
      }
    }

    return null;
  }
}