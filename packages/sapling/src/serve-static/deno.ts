import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";
import type { Context } from "../types/index.ts";

type StaticFileOptions = {
  /** Directory to serve static files from */
  directory: string;
  /** Development mode disables caching */
  dev?: boolean;
  /** Optional URL path prefix for static files */
  urlPrefix?: string;
};

type FileInfo = {
  path: string;
  size: number;
  hash: string;
  readable: ReadableStream;
  close: () => void;
};

/**
 * Serves static files with caching support and optional development mode.
 * 
 * @example
 * Basic usage:
 * ```ts
 * const router = new Router();
 * 
 * // Serve all files from the "public" directory at "/static/*"
 * router.get("/static/*", serveStatic({ 
 *   directory: "./public",
 *   urlPrefix: "/static"
 * }));
 * ```
 * 
 * @example
 * With development mode:
 * ```ts
 * // Disable caching in development
 * router.get("/static/*", serveStatic({ 
 *   directory: "./public",
 *   urlPrefix: "/static",
 *   dev: Deno.env.get("MODE") === "development"
 * }));
 * ```
 * 
 * @example
 * Serve files from the root path:
 * ```ts
 * // Will serve files like favicon.ico, robots.txt from the public directory
 * router.get("/*", serveStatic({ 
 *   directory: "./public"
 * }));
 * ```
 */
export function serveStatic(options: StaticFileOptions): (c: Context) => Promise<Response | null> {
  const fileCache = new Map<string, { hash: string; mtime: number }>();
  const { directory, dev = false, urlPrefix = "" } = options;

  async function getFileInfo(filepath: string): Promise<FileInfo | null> {
    try {
      const file = await Deno.open(filepath);
      const stat = await Deno.stat(filepath);

      // Check cache in production mode
      if (!dev && fileCache.has(filepath)) {
        const cached = fileCache.get(filepath)!;
        if (cached.mtime === stat.mtime?.getTime()) {
          return {
            path: filepath,
            size: stat.size,
            hash: cached.hash,
            readable: (await Deno.open(filepath)).readable,
            close: () => file.close(),
          };
        }
      }

      // Calculate hash for ETag
      const hash = await crypto.subtle.digest(
        "SHA-1",
        new Uint8Array(await file.readable.getReader().read().then(r => r.value || new Uint8Array()))
      );
      const hashHex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // Cache the hash in production
      if (!dev) {
        fileCache.set(filepath, {
          hash: hashHex,
          mtime: stat.mtime?.getTime() || 0,
        });
      }

      // Open a new file handle for the response
      const responseFile = await Deno.open(filepath);

      return {
        path: filepath,
        size: stat.size,
        hash: hashHex,
        readable: responseFile.readable,
        close: () => {
          file.close();
          responseFile.close();
        },
      };
    } catch {
      return null;
    }
  }

  return async function staticFileHandler(c: Context) {
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(c.req.url);
    let pathname = decodeURIComponent(url.pathname);

    // Remove URL prefix if specified
    if (urlPrefix && pathname.startsWith(urlPrefix)) {
      pathname = pathname.slice(urlPrefix.length);
    }

    // Prevent directory traversal
    const normalizedPath = path.normalize(pathname);
    if (normalizedPath.includes("..")) {
      return new Response("Forbidden", { status: 403 });
    }

    // Try different file paths in order:
    // 1. Exact path
    // 2. Path with .html extension
    // 3. Path/index.html if it's a directory
    const possiblePaths = [
      path.join(directory, normalizedPath),
      path.join(directory, normalizedPath + ".html"),
      path.join(directory, normalizedPath, "index.html")
    ];

    let file: FileInfo | null = null;
    for (const filepath of possiblePaths) {
      file = await getFileInfo(filepath);
      if (file) break;
    }

    // if file not found, return null to let the router handle it
    if (!file) {
      return null;
    }

    const headers = new Headers({
      "Content-Type": getContentType(path.extname(file.path)) || "application/octet-stream",
      "Content-Length": String(file.size),
    });

    // Handle caching
    if (!dev) {
      headers.set("ETag", `W/"${file.hash}"`);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      const ifNoneMatch = c.req.headers.get("If-None-Match");
      if (ifNoneMatch === `W/"${file.hash}"`) {
        file.close();
        return new Response(null, { status: 304, headers });
      }
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    if (c.req.method === "HEAD") {
      file.close();
      return new Response(null, { status: 200, headers });
    }

    return new Response(file.readable, { headers });
  };
}
