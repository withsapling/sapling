import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as crypto from "node:crypto";
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
  stream: fs.FileHandle;
};

/**
 * Serves static files with caching support and optional development mode.
 * @param options - Configuration options for serving static files
 * @returns Middleware function that handles static file requests
 * @example
 * ```ts
 * // Basic usage
 * site.get("/static/*", serveStatic({ 
 *   directory: "./public",
 *   urlPrefix: "/static"
 * }));
 * 
 * // A file in the public directory would be served at /static/index.html
 * 
 * // With development mode
 * site.get("/static/*", serveStatic({ 
 *   directory: "./public",
 *   urlPrefix: "/static",
 *   dev: true
 * }));
 * 
 * // Serve from root path
 * site.get("/*", serveStatic({ 
 *   directory: "./public"
 * }));
 * 
 * // A file in the public directory would be served at /index.html
 * ```
 */
export function serveStatic(options: StaticFileOptions): (c: Context) => Promise<Response | null> {
  const fileCache = new Map<string, { hash: string; mtime: number }>();
  const { directory, dev = false, urlPrefix = "" } = options;

  async function getFileInfo(filepath: string): Promise<FileInfo | null> {
    try {
      const file = await fs.open(filepath);
      const stat = await fs.stat(filepath);

      // Check cache in production mode
      if (!dev && fileCache.has(filepath)) {
        const cached = fileCache.get(filepath)!;
        if (cached.mtime === stat.mtime.getTime()) {
          const newFile = await fs.open(filepath);
          return {
            path: filepath,
            size: stat.size,
            hash: cached.hash,
            stream: newFile,
          };
        }
      }

      // Calculate hash for ETag
      const fileBuffer = await fs.readFile(filepath);
      const hash = crypto.createHash('sha1')
        .update(fileBuffer)
        .digest('hex');

      // Cache the hash in production
      if (!dev) {
        fileCache.set(filepath, {
          hash,
          mtime: stat.mtime.getTime(),
        });
      }

      return {
        path: filepath,
        size: stat.size,
        hash,
        stream: file,
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
        await file.stream.close();
        return new Response(null, { status: 304, headers });
      }
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    if (c.req.method === "HEAD") {
      await file.stream.close();
      return new Response(null, { status: 200, headers });
    }

    // Create a ReadableStream from the file
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const buffer = await file.stream.readFile();
          controller.enqueue(buffer);
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          await file.stream.close();
        }
      }
    });

    return new Response(readable, { headers });
  };
}
