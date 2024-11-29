import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";
import type { Context } from "./types/index.ts";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Buffer } from "node:buffer";

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
      const stats = await stat(filepath);

      // Check cache in production mode
      if (!dev && fileCache.has(filepath)) {
        const cached = fileCache.get(filepath)!;
        if (cached.mtime === stats.mtime.getTime()) {
          // Create a new stream for the response
          const stream = createReadStream(filepath);
          return {
            path: filepath,
            size: stats.size,
            hash: cached.hash,
            readable: stream.readable as unknown as ReadableStream,
            close: () => stream.close(),
          };
        }
      }

      // Calculate hash for ETag
      const stream = createReadStream(filepath);
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const hash = await crypto.subtle.digest(
        "SHA-1",
        buffer
      );
      const hashHex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // Cache the hash in production
      if (!dev) {
        fileCache.set(filepath, {
          hash: hashHex,
          mtime: stats.mtime.getTime(),
        });
      }

      // Create a new stream for the response
      const responseStream = createReadStream(filepath);

      return {
        path: filepath,
        size: stats.size,
        hash: hashHex,
        readable: responseStream.readable as unknown as ReadableStream,
        close: () => {
          stream.close();
          responseStream.close();
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

    const filepath = path.join(directory, normalizedPath);
    const file = await getFileInfo(filepath);

    // if file not found, return null to let the router handle it
    if (!file) {
      return null;
    }

    const headers = new Headers({
      "Content-Type": getContentType(path.extname(filepath)) || "application/octet-stream",
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
