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
 * A super simple router for Deno. For advanced routing, use a framework like Hono.
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
		const pattern = new URLPattern({ pathname: path });
		const routes = this.routes.get(method);
		routes?.push({ pattern, handler });
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
		// Replace the hardcoded 404 with the custom handler
		return await this.notFoundHandler(req, {});
	}
}

/**
 * An extension of the Router class for file-based routing
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
