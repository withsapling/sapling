import type { Context } from "./sapling.ts";

interface CookieOptions {
  /** Domain for the cookie (e.g., 'example.com') */
  domain?: string;
  /** When the cookie expires (Date object or UTC timestamp in seconds) */
  expires?: Date | number;
  /** Cookie expiry in seconds from current time */
  maxAge?: number;
  /** HttpOnly cookie flag */
  httpOnly?: boolean;
  /** Path for the cookie */
  path?: string;
  /** Secure cookie flag */
  secure?: boolean;
  /** SameSite cookie attribute */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Get all cookies or a specific cookie value
 * @param c - Context object
 * @param key - Optional cookie name
 * @example
 * ```ts
 * // Get all cookies
 * const cookies = getCookie(c)
 * 
 * // Get specific cookie
 * const sessionId = getCookie(c, 'sessionId')
 * ```
 */
export function getCookie(c: Context): Record<string, string>
export function getCookie(c: Context, key: string): string | undefined
export function getCookie(c: Context, key?: string): Record<string, string> | string | undefined {
  const cookieHeader = c.req.headers.get("cookie");
  if (!cookieHeader) return key ? undefined : {};

  const pairs = cookieHeader.split(/;\s*/);
  const cookies: Record<string, string> = {};

  pairs.forEach(pair => {
    const [k, v] = pair.split('=');
    cookies[k] = decodeURIComponent(v);
  });

  return key ? cookies[key] : cookies;
}

/**
 * Set a cookie with the given options
 * @param c - Context object
 * @param key - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @example
 * ```ts
 * setCookie(c, 'theme', 'dark', {
 *   maxAge: 86400,
 *   httpOnly: true
 * })
 * ```
 */
export function setCookie(
  c: Context,
  key: string,
  value: string,
  options: CookieOptions = {}
): void {
  let cookie = `${key}=${encodeURIComponent(value)}`;

  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options.path) {
    cookie += `; Path=${options.path}`;
  } else {
    cookie += '; Path=/';
  }

  if (options.expires) {
    const expires = typeof options.expires === 'number'
      ? new Date(options.expires * 1000)
      : options.expires;
    cookie += `; Expires=${expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }

  if (options.secure) {
    cookie += '; Secure';
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }

  c.req.headers.append('Set-Cookie', cookie);
}

/**
 * Delete a cookie
 * @param c - Context object
 * @param key - Cookie name
 * @param options - Cookie options (domain and path are important for deletion)
 * @example
 * ```ts
 * deleteCookie(c, 'sessionId')
 * ```
 */
export function deleteCookie(
  c: Context,
  key: string,
  options: CookieOptions = {}
): void {
  setCookie(c, key, '', {
    ...options,
    expires: new Date(0),
  });
}
