import type { Context } from "../types/index.ts";

type StaticFileOptions = {
  /** Directory to serve static files from */
  directory: string;
  /** Optional URL path prefix for static files */
  urlPrefix?: string;
  /** Optional cache control header value. If not provided, defaults to aggressive caching in production */
  cacheControl?: string;
};

let serveStatic: (
  options: StaticFileOptions
) => (c: Context) => Promise<Response | null>;

// Check if we're running in Deno
if (typeof Deno !== "undefined") {
  serveStatic = (await import("./deno.ts")).serveStatic;
} else {
  serveStatic = (await import("./node.ts")).serveStatic;
}

export { serveStatic };
export type { StaticFileOptions };
