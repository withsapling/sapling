import type { Context } from "../types/index.ts";
import type { ContextHandler, Middleware } from "../sapling.ts";

type PrerenderRoute = {
  path: string;
  handler: ContextHandler;
  middleware: Middleware[];
  params?: Record<string, string>[];
};

type PrerenderOptions = {
  /** Directory to output the pre-rendered files */
  outputDir: string;
  /** Function to create a context object */
  createContext: (path: string, params: Record<string, string>) => Context;
};

let buildPrerenderRoutes: (
  routes: PrerenderRoute[],
  options: PrerenderOptions
) => Promise<void>;

// Check if we're running in Deno
if (typeof Deno !== "undefined") {
  buildPrerenderRoutes = (await import("./deno.ts")).buildPrerenderRoutes;
} else {
  buildPrerenderRoutes = (await import("./node.ts")).buildPrerenderRoutes;
}

export { buildPrerenderRoutes };
export type { PrerenderRoute, PrerenderOptions };
