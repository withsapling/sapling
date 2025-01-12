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
    /**
     * Get URL parameters
     * @example
     * ```ts
     * // Get single parameter
     * const id = c.req.param("id");
     * 
     * // Get all parameters
     * const { id, commentId } = c.req.param();
     * ```
     */
    param(): Record<string, string>;
    param(name: string): string;
    method: string;
    url: string;
    headers: Headers;
    /**
     * Get a request header value
     * @param name - The name of the header to get
     * @returns The header value if it exists, otherwise undefined
     * @example
     * ```ts
     * const auth = c.req.header('Authorization');
     * if (auth?.startsWith('Bearer ')) {
     *   // Handle bearer token
     * }
     * ```
     */
    header(name: string): string | undefined;
    /**
     * Parse request body as JSON
     * @template T - The expected type of the JSON data
     * @returns Promise resolving to the parsed JSON data
     * @example
     * ```ts
     * interface CreateSiteBody {
     *   model: string;
     * }
     * const body = await c.req.json<CreateSiteBody>();
     * ```
     */
    json<T = unknown>(): Promise<T>;
    /**
     * Get form data from request
     * @returns Promise resolving to FormData object
     * @example
     * ```ts
     * const form = await c.req.formData();
     * const name = form.get('name');
     * ```
     */
    formData(): Promise<FormData>;
  };
  /** Response headers for the request */
  res: {
    headers: Headers;
  };
  /** Shared state object for passing data between middleware */
  state: Record<string, unknown>;

  /**
   * Set a value in the context state
   * @param key - The key to set
   * @param value - The value to store
   * @example
   * ```ts
   * c.set('currentUser', decodedToken.uid);
   * ```
   */
  set<T>(key: string, value: T): void;

  /**
   * Get a value from the context state
   * @param key - The key to get
   * @returns The value if it exists, otherwise undefined
   * @example
   * ```ts
   * const userId = c.get<string>('currentUser');
   * ```
   */
  get<T>(key: string): T | undefined;

  /**
   * Get URL query parameters
   * @returns URLSearchParams object containing query parameters
   */
  query(): URLSearchParams;

  /**
   * Send JSON response
   * @param data - The data to send as JSON
   * @param status - HTTP status code (optional)
   * @example
   * ```ts
   * site.get("/api/user", (c) => {
   *   return c.json({ name: "John", age: 30 }, 201);
   * });
   * ```
   */
  json(data: unknown, status?: number): Response;

  /**
   * Render HTML response
   * @example
   * ```ts
   * site.get("/", (c) => {
   *   return c.html("<h1>Hello World</h1>");
   * });
   * ```
   */
  html(content: string | ReadableStream): Response;

  /**
   * Send text response
   * @param content - The text content to send
   * @param status - HTTP status code (optional)
   * @example
   * ```ts
   * site.get("/text", (c) => {
   *   return c.text("Hello World");
   * });
   * 
   * site.get("/not-found", (c) => {
   *   return c.text("Not Found", 404);
   * });
   * ```
   */
  text(content: string, status?: number): Response;

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
export type ContextHandler = (c: Context) => Response | Promise<Response | null> | null;

/** Middleware handler type */
export type Middleware = (c: Context, next: () => Promise<Response | null>) => Promise<Response | null>;

/** Internal route configuration */
type Route = {
  pattern: URLPattern;
  handler: ContextHandler;
  middleware: Middleware[];
};

/**
 * Sapling class for handling HTTP requests
 * @example
 * ```ts
 * const site = new Sapling();
 * 
 * // Route with parameters
 * site.get("/users/:id", (c) => {
 *   const userId = c.params.id;
 *   return new Response(`User ${userId}`);
 * });
 * 
 * // Global middleware
 * site.use(async (c, next) => {
 *   console.log("Global middleware");
 *   return await next();
 * });
 * 
 * // Route with middleware function
 * async function middleware(c: Context, next: () => Promise<Response | null>) {
 *   console.log("Global middleware");
 *   return await next();
 * }
 * 
 * site.get("/", middleware, (c) => {
 *   return new Response("Hello World!");
 * });
 * 
 * // Route with specific middleware
 * site.get("/", 
 *   async (c, next) => {
 *     console.log("Route middleware");
 *     return await next();
 *   },
 *   (c) => {
 *     return new Response("Hello World!");
 *   }
 * );
 * ```
 */
export class Sapling {
  private routes: Map<string, Route[]> = new Map();
  private middleware: Middleware[] = [];
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
   * @param handlers - Middleware functions and final handler
   */
  private add(method: string, path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    const patterns = [
      new URLPattern({ pathname: path }),
      new URLPattern({ pathname: path.endsWith('/') ? path : path + '/' })
    ];

    // Last handler is the route handler, everything before is middleware
    const routeHandler = handlers.pop() as ContextHandler;
    const routeMiddleware = handlers as Middleware[];

    const routes = this.routes.get(method);
    patterns.forEach(pattern => {
      routes?.push({
        pattern,
        handler: routeHandler,
        middleware: routeMiddleware
      });
    });

    return this;
  }

  /**
   * Add a GET route handler with optional middleware
   * @example
   * ```ts
   * // Basic route
   * site.get("/hello", (c) => {
   *   return new Response("Hello World!");
   * });
   * 
   * // Route with middleware
   * site.get("/hello",
   *   async (c, next) => {
   *     console.log("Before");
   *     const response = await next();
   *     console.log("After");
   *     return response;
   *   },
   *   (c) => {
   *     return new Response("Hello World!");
   *   }
   * );
   * ```
   */
  get(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("GET", path, ...handlers);
  }

  /**
   * Add a POST route handler with optional middleware
   */
  post(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("POST", path, ...handlers);
  }

  /**
   * Add a PUT route handler with optional middleware
   */
  put(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("PUT", path, ...handlers);
  }

  /**
   * Add a DELETE route handler with optional middleware
   */
  delete(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("DELETE", path, ...handlers);
  }

  /**
   * Add a PATCH route handler with optional middleware
   */
  patch(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("PATCH", path, ...handlers);
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
   * Add middleware to the application
   * @param fn - Middleware function
   * @example
   * ```ts
   * site.use(async (c, next) => {
   *   const start = Date.now();
   *   const response = await next();
   *   const duration = Date.now() - start;
   *   console.log(`Request took ${duration}ms`);
   *   return response;
   * });
   * ```
   */
  use(fn: Middleware): Sapling {
    this.middleware.push(fn);
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
    const ctx = {
      req: {
        param: ((name?: string) => {
          if (name === undefined) return params;
          return params[name] || '';
        }) as {
          (): Record<string, string>;
          (name: string): string;
        },
        method: req.method,
        url: req.url,
        headers: req.headers,
        header: (name: string) => req.headers.get(name) ?? undefined,
        json: async <T = unknown>() => await req.clone().json() as T,
        formData: async () => await req.clone().formData(),
      },
      res: {
        headers: new Headers(),
      },
      state: {} as Record<string, unknown>,
      query: () => new URL(req.url).searchParams,
      set: <T>(key: string, value: T) => {
        ctx.state[key] = value;
      },
      get: <T>(key: string): T | undefined => {
        return ctx.state[key] as T | undefined;
      },
      html: (content: string | ReadableStream) => {
        const headers = {
          "content-type": "text/html; charset=UTF-8",
          ...Object.fromEntries(ctx.res.headers),
        };

        if (typeof content === "string") {
          // If content is a string, return a Response with the string as the body
          return new Response(content, { headers });
        } else {
          // If content is a ReadableStream, return a Response with the stream as the body
          return new Response(content, { headers });
        }
      },
      json: (data: unknown, status?: number) => new Response(JSON.stringify(data), {
        status,
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(ctx.res.headers)
        }
      }),
      text: (content: string, status?: number) => new Response(content, {
        status,
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          ...Object.fromEntries(ctx.res.headers)
        }
      }),
      redirect: (location: string, status = 302) => new Response(null, {
        status,
        headers: { Location: location }
      })
    };
    return ctx;
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

        // Create middleware chain combining global and route-specific middleware
        let index = 0;
        const allMiddleware = [...this.middleware, ...route.middleware];

        const executeMiddleware = async (): Promise<Response | null> => {
          if (index < allMiddleware.length) {
            const middleware = allMiddleware[index++];
            return await middleware(context, executeMiddleware);
          } else {
            return await route.handler(context);
          }
        };

        const response = await executeMiddleware();
        if (response === null) continue;
        return response;
      }
    }

    return null;
  }
}