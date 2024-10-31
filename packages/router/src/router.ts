import { walk } from "@std/fs";

type RouteHandler = (
	req: Request,
	params: Record<string, string>,
) => Response | Promise<Response>;

type Route = {
	pattern: URLPattern;
	handler: RouteHandler;
};

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

	private notFoundHandler: RouteHandler = (req) => {
		// Redirect to /404 while preserving the original URL in the search params
		const notFoundUrl = new URL("/404", req.url);
		notFoundUrl.searchParams.set("from", req.url);
		return Response.redirect(notFoundUrl.toString(), 302);
	};

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
	
	async handle(req: Request): Promise<Response> {
		const method = req.method;
		const url = req.url;

		// Special case: don't redirect /404 to prevent infinite loops
		if (new URL(url).pathname === "/404") {
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
					return await route.handler(req, params);
				}
			}
			// If /404 page is not found, return a basic 404 response
			return new Response("Not Found", { status: 404 });
		}

		// Normal route handling
		const routes = this.routes.get(method);
		if (!routes) {
			return new Response("Method not allowed", { status: 405 });
		}

		for (const route of routes) {
			const match = route.pattern.exec(url);
			// if match, extract params
			if (match) {
				const groups = match.pathname.groups as Record<
					string,
					string | undefined
				>;
				const params = Object.fromEntries(
					Object.entries(groups).filter(([_, v]) => v !== undefined),
				) as Record<string, string>;
				return await route.handler(req, params);
			}
		}
		return await this.notFoundHandler(req, {});
	}
}

/**
 * A router for file-based routing.
 * 
 * @example
 * const router = new PageRouter(new URL("./pages"));
 * router.initialize();
 */
export class PageRouter extends Router {
	private pagesPath: string;

	constructor(pagesDirectory: string | URL) {
		super();
		
		if (pagesDirectory instanceof URL) {
			// Convert URL to file system path
			this.pagesPath = new URL(pagesDirectory).pathname;
		} else {
			this.pagesPath = pagesDirectory;
		}
	}

	async initialize(): Promise<void> {
		try {
			for await (const entry of walk(this.pagesPath, {
				includeDirs: false,
				exts: [".ts", ".tsx", ".js", ".jsx"],
			})) {
				let routePath = entry.path
					.replace(this.pagesPath, "")
					.replace(/\.[^/.]+$/, "") // Remove file extension
					.replace(/\/index$/, ""); // Remove index

				// Convert [param] to :param format BEFORE other processing
				routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");
				
				// Handle root path specially
				if (routePath === "") routePath = "/";
				
				const module = await import(`file://${entry.path}`);
				const handler = module.default;

				if (typeof handler === "function") {
					// Register both versions for dynamic routes too
					this.get(routePath, handler);
					if (!routePath.endsWith("/")) {
						this.get(routePath + "/", handler);
					}

					// For debugging
					// console.log("Registered routes:", routePath, routePath + "/");
				}
			}
		} catch (error) {
			console.error("Error during initialization:", error);
		}
	}
}
