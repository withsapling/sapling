import { walk } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";

/**
 * Context object passed to route handlers
 * @example
 * ```ts
 * router.get("/users/:id", async (c: Context) => {
 *   // Access URL parameters
 *   const userId = c.params.id;
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
 * router.get("/", (c) => {
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
	 * router.post("/api/users", async (c) => {
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
	 * router.get("/api/user", (c) => {
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
	 * router.get("/", (c) => {
	 *   return c.html("<h1>Hello World</h1>");
	 * });
	 * ```
	 */
	html(content: string): Response;

	/**
	 * Send text response
	 * @example
	 * ```ts
	 * router.get("/text", (c) => {
	 *   return c.text("Hello World");
	 * });
	 * ```
	 */
	text(content: string): Response;
}

/** Handler function type for processing requests */
type ContextHandler = (c: Context) => Response | Promise<Response | null> | null;

/** Internal route configuration */
type Route = {
	pattern: URLPattern;
	handler: ContextHandler;
};

/**
 * Router class for handling HTTP requests
 * @example
 * ```ts
 * const router = new Router();
 * 
 * // Basic route
 * router.get("/", (c) => {
 *   return new Response("Hello World!");
 * });
 * 
 * // Route with parameters
 * router.get("/users/:id", (c) => {
 *   const userId = c.params.id;
 *   return new Response(`User ${userId}`);
 * });
 * 
 * // Handle POST with JSON body
 * router.post("/api/users", async (c) => {
 *   const data = await c.json<{ name: string }>();
 *   return new Response(`Created user: ${data.name}`);
 * });
 * 
 * // Custom 404 handler
 * router.setNotFoundHandler((c) => {
 *   return new Response("Custom Not Found", { status: 404 });
 * });
 * ```
 */
export class Router {
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
	private add(method: string, path: string, handler: ContextHandler): Router {
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
	 * router.get("/hello", (c) => {
	 *   return new Response("Hello World!");
	 * });
	 * 
	 * // Route with URL parameters
	 * router.get("/users/:id/posts/:postId", (c) => {
	 *   const { id, postId } = c.params;
	 *   return new Response(`User ${id}, Post ${postId}`);
	 * });
	 * 
	 * // Using query parameters
	 * router.get("/search", (c) => {
	 *   const query = c.query().get("q");
	 *   return new Response(`Search: ${query}`);
	 * });
	 * ```
	 */
	get(path: string, handler: ContextHandler): Router {
		return this.add("GET", path, handler);
	}

	/**
	 * Add a POST route handler
	 * @example
	 * ```ts
	 * // Handle JSON body
	 * router.post("/api/users", async (c) => {
	 *   const user = await c.json<{ name: string; email: string }>();
	 *   return new Response(`Created user: ${user.name}`);
	 * });
	 * 
	 * // Handle form data
	 * router.post("/upload", async (c) => {
	 *   const form = await c.formData();
	 *   const file = form.get("file");
	 *   return new Response(`Uploaded: ${file.name}`);
	 * });
	 * ```
	 */
	post(path: string, handler: ContextHandler): Router {
		return this.add("POST", path, handler);
	}

	/**
	 * Add a PUT route handler
	 * @param path - URL pattern to match
	 * @param handler - Function to handle matching requests
	 */
	put(path: string, handler: ContextHandler): Router {
		return this.add("PUT", path, handler);
	}

	/**
	 * Add a DELETE route handler
	 * @param path - URL pattern to match
	 * @param handler - Function to handle matching requests
	 */
	delete(path: string, handler: ContextHandler): Router {
		return this.add("DELETE", path, handler);
	}

	/**
	 * Add a PATCH route handler
	 * @param path - URL pattern to match
	 * @param handler - Function to handle matching requests
	 */
	patch(path: string, handler: ContextHandler): Router {
		return this.add("PATCH", path, handler);
	}

	/**
	 * Set custom handler for 404 Not Found responses
	 * @example
	 * ```ts
	 * router.setNotFoundHandler((c) => {
	 *   // Return custom 404 page
	 *   return new Response("Custom Not Found Page", {
	 *     status: 404,
	 *     headers: { "Content-Type": "text/html" }
	 *   });
	 * });
	 * ```
	 */
	setNotFoundHandler(handler: ContextHandler): Router {
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

/**
 * File-based router that automatically creates routes from file structure
 * @example
 * ```ts
 * // Initialize file router
 * const router = new FileRouter({
 *   directory: "./routes",
 *   baseUrl: import.meta.url
 * });
 * 
 * // File structure:
 * // routes/
 * //   ├─ index.ts         -> "/"
 * //   ├─ about.ts        -> "/about"
 * //   ├─ users/
 * //   │  ├─ index.ts     -> "/users"
 * //   │  ├─ [id].ts      -> "/users/:id"
 * //   │  └─ [...slug].ts -> "/users/*"
 * 
 * await router.initialize();
 * 
 * // Example route file (routes/users/[id].ts):
 * export default function(c: Context) {
 *   const userId = c.params.id;
 *   return new Response(`User ${userId}`);
 * }
 * ```
 */
export class FileRouter extends Router {
	private routeModules: Record<string, ContextHandler> = {};
	private pagesPath: string;

	/**
	 * Create a new FileRouter
	 * @param options - Configuration options
	 * @param options.directory - Directory containing route files
	 * @param options.baseUrl - Base URL for import.meta.url
	 */
	constructor(options: {
		directory: string;
		baseUrl: string;
	}) {
		super();
		const baseDir = dirname(fromFileUrl(options.baseUrl));
		this.pagesPath = join(baseDir, options.directory);
	}

	/**
	 * Initialize the router by scanning for and loading route files
	 */
	async initialize(): Promise<void> {
		console.warn("%cWARNING%c: The Sapling FileRouter is experimental. It does not currently work in Deno Deploy due to dynamic import limitations.\n", "color: orange; font-weight: bold;", "");

		try {
			// First pass: Load all modules
			for await (const entry of walk(this.pagesPath, {
				includeDirs: false,
				exts: [".ts", ".tsx", ".js", ".jsx"],
			})) {
				const relativePath = entry.path
					.replace(this.pagesPath, "")
					.replace(/\.[^/.]+$/, "");

				const module = await import(entry.path);
				if (typeof module.default === 'function') {
					this.routeModules[relativePath] = module.default;
				}
			}

			// Second pass: Register routes
			for (const [path, handler] of Object.entries(this.routeModules)) {
				let routePath = path
					.replace(/\/index$/, "")
					.replace(/\[\.{3}([^\]]+)\]/g, "*$1")
					.replace(/\[([^\]]+)\]/g, ":$1");

				if (routePath === "") routePath = "/";

				this.get(routePath, async (c) => {
					// Store the original param function
					const originalParam = c.req.param;

					// Create a new param function that handles catch-all routes
					c.req.param = (name: string) => {
						if (name.startsWith('*')) {
							const newName = name.slice(1);
							return originalParam(newName);
						}
						return originalParam(name);
					};

					const result = await handler(c);

					if (result instanceof Response) {
						return result;
					}

					if (result == null) {
						return new Response("Not Found", { status: 404 });
					}

					return c.html(String(result));
				});
			}
		} catch (error) {
			console.error("Error during initialization:", error);
			throw error;
		}
	}
}
