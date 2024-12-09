import type { Context, Middleware } from "./sapling.ts";

export interface CorsOptions {
  origin?: string | string[] | ((origin: string, c: Context) => string | undefined | null)
  allowMethods?: string[]
  allowHeaders?: string[]
  maxAge?: number
  credentials?: boolean
  exposeHeaders?: string[]
}

/**
 * CORS Middleware for Sapling.
 * 
 * @example
 * ```ts
 * // Allow all origins (default)
 * site.use(cors())
 * 
 * // Custom configuration
 * site.use(cors({
 *   origin: 'http://example.com',
 *   allowMethods: ['POST', 'GET', 'OPTIONS'],
 *   allowHeaders: ['X-Custom-Header', 'Authorization'],
 *   exposeHeaders: ['Content-Length'],
 *   maxAge: 600,
 *   credentials: true,
 * }))
 * 
 * // Multiple origins
 * site.use(cors({
 *   origin: ['http://localhost:3000', 'https://example.com']
 * }))
 * 
 * // Function to validate origin
 * site.use(cors({
 *   origin: (origin) => origin.endsWith('example.com') ? origin : null
 * }))
 * ```
 * 
 * @param options - CORS configuration options
 * @param options.origin - Origin configuration. Can be '*' (default), a string, array of strings, or a function
 * @param options.allowMethods - Allowed HTTP methods. Defaults to ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']
 * @param options.allowHeaders - Allowed headers. Defaults to []
 * @param options.exposeHeaders - Headers to expose to the client. Defaults to []
 * @param options.maxAge - Preflight request cache duration in seconds
 * @param options.credentials - Enable credentials (cookies, authorization headers). Defaults to false
 * @returns Middleware function
 */
export const cors = (options?: CorsOptions): Middleware => {
  const defaults: CorsOptions = {
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    allowHeaders: [],
    exposeHeaders: [],
  }
  const opts = {
    ...defaults,
    ...options,
  }

  const findAllowOrigin = ((optsOrigin: string | string[] | ((origin: string, c: Context) => string | undefined | null) = '*') => {
    if (typeof optsOrigin === 'string') {
      if (optsOrigin === '*') {
        return () => optsOrigin
      }
      return (origin: string) => (optsOrigin === origin ? origin : null)
    } else if (typeof optsOrigin === 'function') {
      return optsOrigin
    }
    return (origin: string) => ((optsOrigin as string[]).includes(origin) ? origin : null)
  })(opts.origin)

  return async function cors(c, next) {
    function set(key: string, value: string) {
      c.res.headers.set(key, value)
    }

    const allowOrigin = findAllowOrigin(c.req.header('origin') || '', c)
    if (allowOrigin) {
      set('Access-Control-Allow-Origin', allowOrigin)
    }

    if (opts.origin !== '*') {
      const existingVary = c.req.header('Vary')
      if (existingVary) {
        set('Vary', existingVary)
      } else {
        set('Vary', 'Origin')
      }
    }

    if (opts.credentials) {
      set('Access-Control-Allow-Credentials', 'true')
    }

    if (opts.exposeHeaders?.length) {
      set('Access-Control-Expose-Headers', opts.exposeHeaders.join(','))
    }

    if (c.req.method === 'OPTIONS') {
      if (opts.maxAge != null) {
        set('Access-Control-Max-Age', opts.maxAge.toString())
      }

      if (opts.allowMethods?.length) {
        set('Access-Control-Allow-Methods', opts.allowMethods.join(','))
      }

      let headers = opts.allowHeaders
      if (!headers?.length) {
        const requestHeaders = c.req.header('Access-Control-Request-Headers')
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/)
        }
      }
      if (headers?.length) {
        set('Access-Control-Allow-Headers', headers.join(','))
        c.res.headers.append('Vary', 'Access-Control-Request-Headers')
      }

      c.res.headers.delete('Content-Length')
      c.res.headers.delete('Content-Type')

      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: 'No Content',
      })
    }
    return await next()
  }
}
