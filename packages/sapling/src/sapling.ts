/**
 * @deprecated Sapling is no longer a standalone router.
 * 
 * We recommend using [Hono](https://hono.dev/) instead.
 * 
 * @example
 * ```ts
 * import { Hono } from "@hono/hono";
 * 
 * const app = new Hono();
 * 
 * app.get("/", (c) => c.text("Hello World"));
 * 
 * export default app;
 * ```
 */
export class Sapling {}