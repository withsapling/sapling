import type { Context, Middleware } from "./sapling.ts";

export interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin CORS header
   * @default "*"
   */
  origin?: string | string[] | ((origin: string) => boolean | Promise<boolean>);

  /**
   * Configures the Access-Control-Allow-Methods CORS header
   * @default "GET,HEAD,PUT,PATCH,POST,DELETE"
   */
  methods?: string[];

  /**
   * Configures the Access-Control-Allow-Headers CORS header
   * @default "*"
   */
  allowedHeaders?: string[];

  /**
   * Configures the Access-Control-Expose-Headers CORS header
   * @default []
   */
  exposedHeaders?: string[];

  /**
   * Configures the Access-Control-Allow-Credentials CORS header
   * @default false
   */
  credentials?: boolean;

  /**
   * Configures the Access-Control-Max-Age CORS header
   * @default 86400 (1 day)
   */
  maxAge?: number;
}

const defaultOptions: CorsOptions = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["*"],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,
};

/**
 * Create a CORS middleware with the specified options
 * @example
 * ```ts
 * // Allow all origins
 * site.use(cors());
 * 
 * // Custom configuration
 * site.use(cors({
 *   origin: ["https://example.com", "https://api.example.com"],
 *   methods: ["GET", "POST"],
 *   credentials: true
 * }));
 * 
 * // Function to validate origin
 * site.use(cors({
 *   origin: (origin) => origin.endsWith("example.com")
 * }));
 * ```
 */
export function cors(options: CorsOptions = {}): Middleware {
  const opts = { ...defaultOptions, ...options };

  return async (c: Context, next: () => Promise<Response | null>) => {
    const origin = c.req.headers.get("origin");

    // Handle preflight requests
    if (c.req.method === "OPTIONS") {
      const headers = new Headers();

      // Handle origin
      if (origin) {
        let allowOrigin = "*";

        if (typeof opts.origin === "string") {
          allowOrigin = opts.origin;
        } else if (Array.isArray(opts.origin)) {
          allowOrigin = opts.origin.includes(origin) ? origin : "";
        } else if (typeof opts.origin === "function") {
          allowOrigin = await opts.origin(origin) ? origin : "";
        }

        if (allowOrigin) {
          headers.set("Access-Control-Allow-Origin", allowOrigin);
        }
      }

      // Handle credentials
      if (opts.credentials) {
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      // Handle methods
      if (opts.methods?.length) {
        headers.set("Access-Control-Allow-Methods", opts.methods.join(","));
      }

      // Handle allowed headers
      const requestHeaders = c.req.headers.get("access-control-request-headers");
      if (opts.allowedHeaders?.includes("*") && requestHeaders) {
        headers.set("Access-Control-Allow-Headers", requestHeaders);
      } else if (opts.allowedHeaders?.length) {
        headers.set("Access-Control-Allow-Headers", opts.allowedHeaders.join(","));
      }

      // Handle exposed headers
      if (opts.exposedHeaders?.length) {
        headers.set("Access-Control-Expose-Headers", opts.exposedHeaders.join(","));
      }

      // Handle max age
      if (opts.maxAge) {
        headers.set("Access-Control-Max-Age", opts.maxAge.toString());
      }

      // Return preflight response
      return new Response(null, {
        status: 204,
        headers
      });
    }

    // Handle actual request
    const response = await next();
    if (!response) return response;

    const headers = new Headers(response.headers);

    // Handle origin for actual request
    if (origin) {
      let allowOrigin = "*";

      if (typeof opts.origin === "string") {
        allowOrigin = opts.origin;
      } else if (Array.isArray(opts.origin)) {
        allowOrigin = opts.origin.includes(origin) ? origin : "";
      } else if (typeof opts.origin === "function") {
        allowOrigin = await opts.origin(origin) ? origin : "";
      }

      if (allowOrigin) {
        headers.set("Access-Control-Allow-Origin", allowOrigin);
      }
    }

    // Handle credentials for actual request
    if (opts.credentials) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    // Handle exposed headers for actual request
    if (opts.exposedHeaders?.length) {
      headers.set("Access-Control-Expose-Headers", opts.exposedHeaders.join(","));
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}
