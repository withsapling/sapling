import type { Context } from "../types/index.ts";
import type { ContextHandler } from "../sapling.ts";

export type PrerenderRoute = {
  path: string;
  handler: ContextHandler;
  params?: Record<string, any>[];
};

export type PrerenderOptions = {
  /** Directory to output the pre-rendered files */
  outputDir: string;
  /** Development mode */
  dev?: boolean;
  /** Function to create a context object */
  createContext: (req: Request, params: Record<string, string>) => Context;
};

let generatePrerenderedPages: (routes: PrerenderRoute[], options: PrerenderOptions) => Promise<void>;

// Check if we're running in Deno
if (typeof Deno !== "undefined") {
  generatePrerenderedPages = (await import("./deno.ts")).generatePrerenderedPages;
} else {
  generatePrerenderedPages = (await import("./node.ts")).generatePrerenderedPages;
}

export { generatePrerenderedPages };
export type { PrerenderOptions }; 