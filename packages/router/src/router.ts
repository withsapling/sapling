import { walk } from "@std/fs";
import { render } from "./render.ts";
import { dirname, fromFileUrl, join } from "@std/path";

type RouteParams = Record<string, string | string[]>;

type RouteHandler = (
	req: Request,
	params: RouteParams,
) => Response | Promise<Response | null> | null;

type Route = {
	pattern: URLPattern;
	handler: RouteHandler;
};

/**
 *  A Performance improvement to think about	 
 * */
// type Route = {
// 	pattern: URLPattern;
// 	handler: RouteHandler;
// 	// Add a score for route specificity
// 	specificity: number;
// };

// export class Router {
// 	// ... existing code ...

// 	private calculateSpecificity(path: string): number {
// 			// Higher numbers = more specific routes
// 			let score = 0;
// 			const segments = path.split('/').filter(Boolean);

// 			for (const segment of segments) {
// 					if (segment.startsWith('*')) score += 1;      // Catch-all params
// 					else if (segment.startsWith(':')) score += 2; // Dynamic params
// 					else score += 3;                              // Static segments
// 			}
// 			return score;
// 	}

// 	private add(method: string, path: string, handler: RouteHandler): Router {
// 			const patterns = [
// 					new URLPattern({ pathname: path }),
// 					new URLPattern({ pathname: path.endsWith('/') ? path : path + '/' })
// 			];

// 			const routes = this.routes.get(method);
// 			patterns.forEach(pattern => {
// 					routes?.push({ 
// 							pattern, 
// 							handler,
// 							specificity: this.calculateSpecificity(path)
// 					});
// 			});

// 			// Sort routes by specificity (most specific first)
// 			routes?.sort((a, b) => b.specificity - a.specificity);

// 			return this;
// 	}
// }

/**
 * A simple router for Deno. For advanced routing, use a framework like Hono.
 * 
 * @example
 * const router = new Router();
 * router.get("/", () => new Response("Hello, world!"));
 * router.get("/user/:id", (req, params) => new Response(`User ${params.id}`));
 */
export class Router {
	private routes: Map<string, Route[]> = new Map();

	private notFoundHandler: RouteHandler = () =>
		new Response("Not found", { status: 404 });

	constructor() {
		// Initialize maps for different HTTP methods
		["GET", "POST", "PUT", "DELETE", "PATCH"].forEach((method) => {
			this.routes.set(method, []);
		});
	}

	private add(method: string, path: string, handler: RouteHandler): Router {
		// Create patterns for both with and without trailing slash
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

	get(path: string, handler: RouteHandler): Router {
		return this.add("GET", path, handler);
	}

	post(path: string, handler: RouteHandler): Router {
		return this.add("POST", path, handler);
	}

	put(path: string, handler: RouteHandler): Router {
		return this.add("PUT", path, handler);
	}

	delete(path: string, handler: RouteHandler): Router {
		return this.add("DELETE", path, handler);
	}

	patch(path: string, handler: RouteHandler): Router {
		return this.add("PATCH", path, handler);
	}

	// Add a new method to set custom 404 handler
	setNotFoundHandler(handler: RouteHandler): Router {
		this.notFoundHandler = handler;
		return this;
	}

	/**
	 * Fetch handler compatible with web standards and similar to Hono's API
	 */
	fetch = async (req: Request): Promise<Response> => {
		const response = await this.handle(req);
		const notFoundResponse = await this.notFoundHandler(req, {});
		return response ?? notFoundResponse ?? new Response("Not found", { status: 404 });
	};

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

				const response = await route.handler(req, params);
				if (response === null) continue;
				return response;
			}
		}

		return null;
	}
}

/**
 * An extension of the Router class for file-based routing
 * 
 * @example
 * // main.ts
 * const router = new FileRouter({
 *   directory: "./pages",
 *   baseUrl: import.meta.url,
 * });
 * await router.initialize();
 * 
 * // pages/blog/[slug].ts
 * export default async function BlogPost(req: Request, params: { slug: string }) {
 *   return `Blog post: ${params.slug}`;
 *   // or return a Response object
 *   // or return html`<h1>Blog post: ${params.slug}</h1>`;
 * }
 * 
 * // Supported file patterns:
 * // pages/index.ts -> "/"
 * // pages/about.ts -> "/about"
 * // pages/blog/index.ts -> "/blog"
 * // pages/blog/[slug].ts -> "/blog/:slug"
 * // pages/[category]/[id].ts -> "/:category/:id"
 * // pages/blog/[...slug].ts -> "/blog/*slug"
 */
/**
 * An extension of the Router class for file-based routing.
 * Automatically creates routes based on the file structure in a directory.
 * 
 * @example
 * // main.ts
 * const router = new FileRouter({
 *   directory: "./pages",
 *   baseUrl: import.meta.url,
 * });
 * await router.initialize();
 * 
 * // Supported file patterns:
 * // pages/index.ts -> "/"
 * // pages/about.ts -> "/about"
 * // pages/blog/index.ts -> "/blog"
 * // pages/blog/[slug].ts -> "/blog/:slug"
 * // pages/[category]/[id].ts -> "/:category/:id"
 * // pages/docs/[...slug].ts -> "/docs/*slug" (catch-all route)
 */
export class FileRouter extends Router {
	private routeModules: Record<string, RouteHandler> = {};
	private pagesPath: string;

	constructor(options: {
		directory: string;
		baseUrl: string;
	}) {
		super();
		// Keep the path resolution logic for local development compatibility
		const baseDir = dirname(fromFileUrl(options.baseUrl));
		this.pagesPath = join(baseDir, options.directory);
	}

	async initialize(): Promise<void> {
		console.warn("%cThe Sapling FileRouter is experimental. It does not currently work in Deno Deploy.", "color: orange;");

		try {
			// First pass: Load all modules at startup
			for await (const entry of walk(this.pagesPath, {
				includeDirs: false,
				exts: [".ts", ".tsx", ".js", ".jsx"],
			})) {
				// Get the relative path for the route
				const relativePath = entry.path
					.replace(this.pagesPath, "")
					.replace(/\.[^/.]+$/, "");

				// Import the module using the full file path
				const module = await import(entry.path);
				if (typeof module.default === 'function') {
					this.routeModules[relativePath] = module.default;
				}
			}

			// Second pass: Register all routes
			for (const [path, handler] of Object.entries(this.routeModules)) {
				let routePath = path
					// Remove "index" from path (index.ts -> /)
					.replace(/\/index$/, "")
					// Convert file-based route patterns to URLPattern syntax:
					// [...param] -> *param (catch-all routes)
					.replace(/\[\.{3}([^\]]+)\]/g, "*$1")
					// [param] -> :param (dynamic routes)
					.replace(/\[([^\]]+)\]/g, ":$1");

				// Empty path becomes root route
				if (routePath === "") routePath = "/";

				this.get(routePath, async (req, params) => {
					// Process route parameters
					const processedParams: RouteParams = { ...params };

					// Handle catch-all route parameters
					for (const [key, value] of Object.entries(params)) {
						if (key.startsWith('*') && typeof value === 'string') {
							// Remove the * prefix from parameter name
							const newKey = key.slice(1);
							// Store the full path string
							processedParams[newKey] = value;
							// Split the path into segments for easier consumption
							processedParams[`${newKey}Segments`] = value.split('/').filter(Boolean);
							// Remove the original *-prefixed parameter
							delete processedParams[key];
						}
					}

					// Call the route handler with the processed parameters
					const result = await handler(req, processedParams);

					// Handle different types of responses:
					if (result instanceof Response) {
						// Return Response objects as-is
						return result;
					}

					if (result == null) {
						// null/undefined results become 404s
						return new Response("Not Found", { status: 404 });
					}

					// Convert other results (like strings) to Response objects
					return render(String(result));
				});
			}
		} catch (error) {
			console.error("Error during initialization:", error);
			throw error;
		}
	}
}
