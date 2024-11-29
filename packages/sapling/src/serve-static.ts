import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";
import type { Context } from "./types/index.ts";

/** Options for serving static files */
type StaticFileOptions = {
  /** Directory to serve static files from */
  directory: string;
  /** Development mode disables caching */
  dev?: boolean;
  /** Optional URL path prefix for static files */
  urlPrefix?: string;
};

/** Information about a static file */
type FileInfo = {
  /** Full path to the file */
  path: string;
  /** File size in bytes */
  size: number;
  /** File hash for ETag */
  hash: string;
  /** File content as a readable stream */
  readable: ReadableStream;
  /** Function to close the file handle */
  close: () => void;
};

/** Detects if running in Node.js environment */
const isNode = typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Converts a Node.js readable stream to a Web ReadableStream
 * @param nodeStream Node.js ReadStream to convert
 * @returns Web ReadableStream
 */
function fileStreamToWeb(nodeStream: any): ReadableStream {
  if (!isNode) return nodeStream;

  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Uint8Array) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err: Error) => controller.error(err));
    },
  });
}

/** 
 * Runtime abstraction for file system operations.
 * Provides consistent APIs for both Deno and Node.js environments.
 */
const runtime = {
  /**
   * Opens a file and returns a readable stream
   * @param filepath Path to the file to open
   */
  async open(filepath: string) {
    if (isNode) {
      const fs = await import('node:fs/promises');
      const handle = await fs.open(filepath, 'r');
      return {
        readable: await fileStreamToWeb(handle.createReadStream()),
        close: () => handle.close()
      };
    } else {
      const file = await Deno.open(filepath);
      return {
        readable: file.readable,
        close: () => file.close()
      };
    }
  },

  /**
   * Gets file stats
   * @param filepath Path to the file
   */
  async stat(filepath: string) {
    if (isNode) {
      const fs = await import('node:fs/promises');
      return fs.stat(filepath);
    } else {
      return Deno.stat(filepath);
    }
  },

  /** Path utilities for the current runtime */
  path: isNode ? await import('node:path') : await import('@std/path'),
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
      const stat = await runtime.stat(filepath);

      // Check cache in production mode
      if (!dev && fileCache.has(filepath)) {
        const cached = fileCache.get(filepath)!;
        const mtime = stat.mtime?.getTime() || 0;
        if (cached.mtime === mtime) {
          const file = await runtime.open(filepath);
          return {
            path: filepath,
            size: stat.size,
            hash: cached.hash,
            readable: file.readable,
            close: file.close,
          };
        }
      }

      // Initial file open for hash calculation
      const file = await runtime.open(filepath);

      // Calculate hash for ETag
      const hash = await crypto.subtle.digest(
        "SHA-1",
        isNode
          ? await streamToBuffer(file.readable)
          : await file.readable.tee()[0].getReader().read().then(r => r.value || new Uint8Array())
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
      const responseFile = await runtime.open(filepath);

      return {
        path: filepath,
        size: stat.size,
        hash: hashHex,
        readable: responseFile.readable,
        close: responseFile.close,
      };
    } catch {
      return null;
    }
  }

  // Helper functions
  async function streamToBuffer(stream: ReadableStream): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
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
