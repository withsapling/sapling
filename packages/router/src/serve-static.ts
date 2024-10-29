import { StaticFileCache } from "./cache.ts";

/**
 * Serves static files from a specified directory
 * @param staticDir The directory to serve files from
 * @param options Optional configuration for static file serving
 * @example
 * // Serve files from /static/* path
 * const staticHandler = serveStatic("./static", {
 *   baseUrl: "static",
 *   notFoundHandler: () => new Response("Not found", { status: 404 }),
 *   dev: true,
 * });
 * router.get("/static/*", staticHandler);
 * 
 * @example
 * // Serve files from root path /*
 * const staticHandler = serveStatic("./static", {
 *   notFoundHandler: () => new Response("Not found", { status: 404 }),
 *   dev: true,
 * });
 * router.get("/*", staticHandler);
 */
interface StaticFileHandler {
  (req: Request): Promise<Response>;
  cache: StaticFileCache;
}

export function serveStatic(staticDir: string | URL, options: {
  baseUrl?: string;
  notFoundHandler?: (req: Request) => Response | Promise<Response>;
  dev?: boolean;
} = {}): StaticFileHandler {
  // Convert string paths to absolute URLs
  const baseDir = staticDir instanceof URL 
    ? staticDir 
    : new URL(`file://${Deno.cwd()}/${staticDir}`);
    
  // Normalize baseUrl by removing leading and trailing slashes
  const baseUrl = options.baseUrl?.replace(/^\/|\/$/g, '') || '';
  const cache = new StaticFileCache();
  
  const handler = async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      let path = decodeURIComponent(url.pathname);
      
      // Remove leading slash
      path = path.replace(/^\//, '');
      
      // Only apply baseUrl check if it's specified
      if (baseUrl && !path.startsWith(baseUrl)) {
        return new Response('Not Found', { status: 404 });
      }
      
      // Remove baseUrl prefix if present
      if (baseUrl) {
        path = path.slice(baseUrl.length + 1);
      }

      const filePath = new URL(path, baseDir);

      // Prevent directory traversal attacks
      if (!filePath.pathname.startsWith(baseDir.pathname)) {
        return new Response('Forbidden', { status: 403 });
      }

      const file = await cache.readFile(filePath.pathname);
      
      if (!file) {
        return options.notFoundHandler?.(req) ?? 
               new Response('Not Found', { status: 404 });
      }

      // Check if file is unmodified
      if (cache.isNotModified(req, file)) {
        file.close();
        return new Response(null, { 
          status: 304,
          headers: cache.createCacheHeaders(file, options.dev)
        });
      }

      // Get the file's content type
      const contentType = getContentType(path);
      const headers = cache.createCacheHeaders(file, options.dev);
      headers.set('content-type', contentType);

      return new Response(file.readable, { headers });
    } catch (error) {
      console.error('Error serving static file:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  };

  return Object.assign(handler, { cache });
}

/**
 * Gets the content type based on file extension
 */
function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const contentTypes: Record<string, string> = {
    'aac': 'audio/aac',
    'avi': 'video/x-msvideo',
    'avif': 'image/avif',
    'av1': 'video/av1',
    'bin': 'application/octet-stream',
    'bmp': 'image/bmp',
    'css': 'text/css',
    'csv': 'text/csv',
    'eot': 'application/vnd.ms-fontobject',
    'epub': 'application/epub+zip',
    'gif': 'image/gif',
    'gz': 'application/gzip',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'ics': 'text/calendar',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json',
    'jsonld': 'application/ld+json',
    'map': 'application/json',
    'mid': 'audio/x-midi',
    'midi': 'audio/x-midi',
    'mjs': 'text/javascript',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'mpeg': 'video/mpeg',
    'oga': 'audio/ogg',
    'ogv': 'video/ogg',
    'ogx': 'application/ogg',
    'opus': 'audio/opus',
    'otf': 'font/otf',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'rtf': 'application/rtf',
    'svg': 'image/svg+xml',
    'tif': 'image/tiff',
    'tiff': 'image/tiff',
    'ts': 'video/mp2t',
    'ttf': 'font/ttf',
    'txt': 'text/plain',
    'wasm': 'application/wasm',
    'webm': 'video/webm',
    'weba': 'audio/webm',
    'webp': 'image/webp',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'xhtml': 'application/xhtml+xml',
    'xml': 'application/xml',
    'zip': 'application/zip',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
    'gltf': 'model/gltf+json',
    'glb': 'model/gltf-binary'
  };

  return contentTypes[ext] || 'application/octet-stream';
}
