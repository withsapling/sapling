// load urlpattern-polyfill if not supported in the run time such as Node.js
// @ts-ignore: Property 'URLPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

import { serveStatic } from "./serve-static/index.ts";

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
     * The raw Request object
     * @example
     * ```ts
     * const raw = c.req.raw;
     * console.log(raw.headers);
     * ```
     */
    raw: Request;
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
    /**
     * Get URL query parameters
     * @example
     * ```ts
     * // Get single query parameter
     * const q = c.req.query('q')
     *
     * // Get all query parameters
     * const { q, limit, offset } = c.req.query()
     * ```
     */
    query(): Record<string, string>;
    query(name: string): string;
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
    /**
     * Get request body as text
     * @returns Promise resolving to the request body as text
     * @example
     * ```ts
     * const body = await c.req.text();
     * console.log('Request body:', body);
     * ```
     */
    text(): Promise<string>;
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
   * Get URL query parameters (deprecated, use c.req.query() instead)
   * @returns URLSearchParams object containing query parameters
   * @deprecated Use c.req.query() instead
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
export type ContextHandler = (
  c: Context
) => Response | Promise<Response | null> | null;

export type Next = () => Promise<Response | null>;

/** Middleware handler type */
export type Middleware = (c: Context, next: Next) => Promise<Response | null>;

/** Internal route configuration */
type Route = {
  pattern: URLPattern;
  handler: ContextHandler;
  middleware: Middleware[];
};

/**
 * Configuration options for creating a Sapling instance
 */
export interface SaplingOptions {
  /**
   * Enable development mode
   * @default false
   */
  dev?: boolean;

  /**
   * Directory where prerendered pages are built
   * @default "./dist"
   */
  buildDir?: string;

  /**
   * Cache-Control header value for prerendered pages
   * @default "public,max-age=0,must-revalidate"
   */
  prerenderCacheControl?: string;
}

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
 *
 * // Prerender a static route
 * site.prerender("/about", (c) => {
 *   return c.html("<h1>About Us</h1>");
 * });
 *
 * // Prerender dynamic routes with parameters
 * site.prerender("/blog/:slug", async (c) => {
 *   const post = await getPost(c.req.param("slug"));
 *   return c.html(`<h1>${post.title}</h1>${post.content}`);
 * }, [
 *   { slug: "first-post" },
 *   { slug: "second-post" }
 * ]);
 * ```
 */
export class Sapling {
  private routes: Map<string, Route[]> = new Map();
  private middleware: Middleware[] = [];
  private notFoundHandler: ContextHandler = () =>
    new Response("Not found", { status: 404 });
  private prerenderRoutes: {
    path: string;
    handler: ContextHandler;
    middleware: Middleware[];
    params?: Record<string, string>[];
  }[] = [];
  private dev: boolean;
  private hasWarnedPrerender: boolean = false;
  private buildDir: string;
  private prerenderCacheControl: string;

  /**
   * Create a new Sapling instance
   * @param options - Configuration options
   */
  constructor(options: SaplingOptions = {}) {
    this.dev = options.dev ?? false;
    this.buildDir = options.buildDir ?? "./dist";
    this.prerenderCacheControl =
      options.prerenderCacheControl ?? "public,max-age=0,must-revalidate";
    [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
      "TRACE",
      "CONNECT",
    ].forEach((method) => {
      this.routes.set(method, []);
    });
  }

  /**
   * Add a route handler for a specific HTTP method and path
   * @param method - HTTP method
   * @param path - URL pattern to match
   * @param handlers - Middleware functions and final handler
   */
  private add(
    method: string,
    path: string,
    ...handlers: (Middleware | ContextHandler)[]
  ): Sapling {
    const patterns = [
      new URLPattern({ pathname: path }),
      new URLPattern({ pathname: path.endsWith("/") ? path : path + "/" }),
    ];

    // Last handler is the route handler, everything before is middleware
    const routeHandler = handlers.pop() as ContextHandler;
    const routeMiddleware = handlers as Middleware[];

    // If method is "ALL", add the route to all HTTP methods
    if (method === "ALL") {
      this.routes.forEach((routes, _) => {
        patterns.forEach((pattern) => {
          routes.push({
            pattern,
            handler: routeHandler,
            middleware: routeMiddleware,
          });
        });
      });
    } else {
      const routes = this.routes.get(method);
      patterns.forEach((pattern) => {
        routes?.push({
          pattern,
          handler: routeHandler,
          middleware: routeMiddleware,
        });
      });
    }

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
   * Add an OPTIONS route handler with optional middleware
   * @param path - URL pattern to match
   * @param handlers - Middleware functions and final handler
   * @example
   * ```ts
   * // Basic OPTIONS handler
   * site.options("/api/users", (c) => {
   *   return new Response(null, {
   *     status: 204,
   *     headers: {
   *       "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
   *       "Access-Control-Allow-Headers": "Content-Type, Authorization"
   *     }
   *   });
   * });
   *
   * // OPTIONS handler with middleware
   * site.options("/api/users",
   *   async (c, next) => {
   *     // Add CORS headers
   *     c.res.headers.set("Access-Control-Allow-Origin", "*");
   *     return next();
   *   },
   *   (c) => {
   *     return new Response(null, {
   *       status: 204,
   *       headers: c.res.headers
   *     });
   *   }
   * );
   * ```
   *
   * Global OPTIONS handler
   * site.use(cors());
   * site.options("*", (c) => {
   *   return new Response(null, { status: 204 });
   * });
   */
  options(path: string, ...handlers: (Middleware | ContextHandler)[]): Sapling {
    return this.add("OPTIONS", path, ...handlers);
  }

  /**
   * Add a route handler for all HTTP methods. The path parameter is optional.
   * @param pathOrHandler - URL pattern to match or handler if no path is provided
   * @param handlers - Middleware functions and final handler
   * @example
   * ```ts
   * // Handle all methods for a specific route
   * site.all("/api/endpoint", (c) => {
   *   return c.text(`Handled ${c.req.method} request`);
   * });
   *
   * // Handle all methods for all routes
   * site.all((c) => {
   *   return c.text(`Handled ${c.req.method} request for ${c.req.url}`);
   * });
   *
   * // With middleware
   * site.all("/api/endpoint",
   *   async (c, next) => {
   *     console.log(`${c.req.method} request received`);
   *     return next();
   *   },
   *   (c) => {
   *     return c.text(`Handled ${c.req.method} request`);
   *   }
   * );
   * ```
   */
  all(
    pathOrHandler: string | Middleware | ContextHandler,
    ...handlers: (Middleware | ContextHandler)[]
  ): Sapling {
    // If first argument is a function, treat it as a handler for root path
    if (typeof pathOrHandler === "function") {
      return this.add("ALL", "/", pathOrHandler, ...handlers);
    }
    return this.add("ALL", pathOrHandler, ...handlers);
  }

  /**
   * Set custom handler for 404 Not Found responses
   * @example
   * ```ts
   * site.notFound((c) => {
   *   return c.text("Custom 404 Message", 404);
   * });
   * ```
   *
   * ```ts
   * site.notFound((c) => {
   *   return c.html("<h1>Custom 404 Page</h1>");
   * });
   * ```
   */
  notFound(handler: ContextHandler): Sapling {
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

    // If the response is null, we need to handle the 404 error
    if (response === null) {
      const context = this.createContext(req, {});
      const notFoundResponse = await this.notFoundHandler(context);
      return notFoundResponse ?? new Response("Not found", { status: 404 });
    }
    return response;
  };

  /**
   * Create a new context object for a request
   * @param req - Request object
   * @param params - URL parameters
   */
  private createContext(req: Request, params: Record<string, string>): Context {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const ctx = {
      req: {
        raw: req,
        param: ((name?: string) => {
          if (name === undefined) return params;
          return params[name] || "";
        }) as {
          (): Record<string, string>;
          (name: string): string;
        },
        query: ((name?: string) => {
          if (name === undefined) return queryParams;
          return searchParams.get(name) || "";
        }) as {
          (): Record<string, string>;
          (name: string): string;
        },
        method: req.method,
        url: req.url,
        headers: req.headers,
        header: (name: string) => req.headers.get(name) ?? undefined,
        json: async <T = unknown>() => (await req.clone().json()) as T,
        formData: async () => await req.clone().formData(),
        text: async () => await req.clone().text(),
      },
      res: {
        headers: new Headers(),
      },
      state: {} as Record<string, unknown>,
      query: () => searchParams,
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
          return new Response(content, { headers });
        } else {
          return new Response(content, { headers });
        }
      },
      json: (data: unknown, status?: number) =>
        new Response(JSON.stringify(data), {
          status,
          headers: {
            "content-type": "application/json",
            ...Object.fromEntries(ctx.res.headers),
          },
        }),
      text: (content: string, status?: number) =>
        new Response(content, {
          status,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
            ...Object.fromEntries(ctx.res.headers),
          },
        }),
      redirect: (location: string, status = 302) =>
        new Response(null, {
          status,
          headers: { Location: location },
        }),
    };

    // Add dev mode to context state
    ctx.state.dev = this.dev;

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
        const groups = match.pathname.groups as Record<
          string,
          string | undefined
        >;
        const params = Object.fromEntries(
          Object.entries(groups).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>;

        const context = this.createContext(req, params);

        // Create middleware chain combining global and route-specific middleware
        let index = 0;
        const allMiddleware = [...this.middleware, ...route.middleware];

        const executeMiddleware: Next = async () => {
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

  /**
   * Register a route for pre-rendering with optional parameters
   * @param path - The path to pre-render (can include dynamic segments like /:slug)
   * @param handlers - Array of middleware functions and final handler
   * @param params - Optional array of parameter objects for dynamic routes
   * @example
   * ```ts
   * // Basic prerender route
   * site.prerender("/about", (c) => {
   *   return c.html("<h1>About Us</h1>");
   * });
   *
   * // Prerender route with middleware
   * site.prerender("/dashboard",
   *   async (c, next) => {
   *     // Check authentication
   *     if (!isAuthenticated(c)) {
   *       return c.redirect('/login');
   *     }
   *     return next();
   *   },
   *   (c) => {
   *     return c.html("<h1>Dashboard</h1>");
   *   }
   * );
   *
   * // Prerender dynamic routes with params
   * site.prerender("/blog/:slug",
   *   async (c) => {
   *     const post = await getPost(c.req.param("slug"));
   *     return c.html(`<h1>${post.title}</h1>${post.content}`);
   *   },
   *   [
   *     { slug: "first-post" },
   *     { slug: "second-post" }
   *   ]
   * );
   *
   * // Prerender dynamic routes with middleware and params
   * site.prerender("/blog/:slug",
   *   async (c, next) => {
   *     // Add cache headers
   *     c.res.headers.set('Cache-Control', 'public, max-age=3600');
   *     return next();
   *   },
   *   async (c) => {
   *     const post = await getPost(c.req.param("slug"));
   *     return c.html(`<h1>${post.title}</h1>${post.content}`);
   *   },
   *   [
   *     { slug: "first-post" },
   *     { slug: "second-post" }
   *   ]
   * );
   * ```
   */
  prerender(
    path: string,
    ...args: Array<Middleware | ContextHandler | Record<string, string>[]>
  ): Sapling {
    const handlers = [...args];

    // Extract params array if it's the last argument
    const lastArg = handlers[handlers.length - 1];
    const params = Array.isArray(lastArg)
      ? (handlers.pop() as Record<string, string>[])
      : undefined;

    // Last handler is the route handler, everything before is middleware
    const routeHandler = handlers.pop() as ContextHandler;
    const routeMiddleware = handlers as Middleware[];

    // Store the route for later prerendering during build
    this.prerenderRoutes.push({
      path,
      handler: routeHandler,
      middleware: routeMiddleware,
      params,
    });

    if (this.dev) {
      // In development mode, register as a dynamic route with middleware
      this.get(path, ...routeMiddleware, routeHandler);
      // Warn if prerender routes are detected in development mode
      if (!this.hasWarnedPrerender) {
        console.warn(
          `\nPrerender routes detected!\nRemember to run site.buildPrerenderRoutes("${this.buildDir}") to generate the static files for production.`
        );
        this.hasWarnedPrerender = true;
      }
    } else {
      // In production, we serve prerendered files but still want middleware support
      // First, create the static file handler that will serve the prerendered content
      const staticHandler = serveStatic({
        root: this.buildDir,
        // Override cache control for prerendered pages to ensure fresh content
        cacheControl: this.prerenderCacheControl,
      });

      // Create a handler that combines global and route-specific middleware with static file serving
      // This ensures middleware runs before serving the prerendered content
      const combinedHandler: ContextHandler = async (c) => {
        // Set up the middleware execution chain
        let index = 0;
        // Include both global and route-specific middleware
        const allMiddleware = [...this.middleware, ...routeMiddleware];

        // Create a recursive function to execute middleware in sequence
        const executeMiddleware: Next = async () => {
          if (index < allMiddleware.length) {
            // Execute the next middleware in the chain
            // Pass executeMiddleware as the 'next' function to allow middleware to control the flow
            const middleware = allMiddleware[index++];
            return await middleware(c, executeMiddleware);
          } else {
            // Once all middleware has executed, serve the static file
            return await staticHandler(c);
          }
        };

        // Start the middleware chain execution
        return await executeMiddleware();
      };

      // Register the combined handler as a GET route
      this.get(path, combinedHandler);
    }

    return this;
  }

  /**
   * Generate pre-rendered HTML files for registered routes
   * @param outputDir - The directory to output the HTML files
   * @returns {Promise<void>} A promise that resolves when all files have been generated
   * @example
   * ```ts
   * // Generate pre-rendered pages in the dist directory
   * await site.buildPrerenderRoutes("./dist");
   *
   * // You can also use a relative path
   * await site.buildPrerenderRoutes("../dist");
   *
   * // Or an absolute path
   * await site.buildPrerenderRoutes("/var/www/html");
   * ```
   */
  async buildPrerenderRoutes(outputDir: string): Promise<void> {
    const { buildPrerenderRoutes } = await import("./prerender/index.ts");

    await buildPrerenderRoutes(this.prerenderRoutes, {
      outputDir,
      createContext: (path: string, params: Record<string, string>) => {
        const headers = new Headers();
        const resHeaders = new Headers();
        const state: Record<string, unknown> = { dev: false };

        return {
          req: {
            raw: new Request(`http://localhost${path}`, {
              method: "GET",
              headers,
            }),
            param: ((name?: string) => {
              if (name === undefined) return params;
              return params[name] || "";
            }) as {
              (): Record<string, string>;
              (name: string): string;
            },
            query: (() => ({})) as {
              (): Record<string, string>;
              (name: string): string;
            },
            method: "GET",
            url: `http://localhost${path}`,
            headers,
            header: (name: string) => headers.get(name) ?? undefined,
            json: <T>() => Promise.resolve({} as T),
            formData: () => Promise.resolve(new FormData()),
            text: () => Promise.resolve(""),
          },
          res: {
            headers: resHeaders,
          },
          state,
          query: () => new URLSearchParams(),
          set: <T>(key: string, value: T) => {
            state[key] = value;
          },
          get: <T>(key: string): T | undefined => {
            return state[key] as T | undefined;
          },
          html: (content: string | ReadableStream) => {
            const headers = {
              "content-type": "text/html; charset=UTF-8",
              ...Object.fromEntries(resHeaders),
            };

            if (typeof content === "string") {
              return new Response(content, { headers });
            } else {
              return new Response(content, { headers });
            }
          },
          json: (data: unknown, status?: number) =>
            new Response(JSON.stringify(data), {
              status,
              headers: {
                "content-type": "application/json",
                ...Object.fromEntries(resHeaders),
              },
            }),
          text: (content: string, status?: number) =>
            new Response(content, {
              status,
              headers: {
                "content-type": "text/plain; charset=UTF-8",
                ...Object.fromEntries(resHeaders),
              },
            }),
          redirect: (location: string, status = 302) =>
            new Response(null, {
              status,
              headers: { Location: location },
            }),
        };
      },
    });
  }
}
