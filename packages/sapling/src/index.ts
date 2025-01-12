import { Sapling } from "./sapling.ts";
import { Layout } from "./sapling-layout.ts";
import { serveStatic } from "./serve-static/index.ts";

// export html and raw helpers from hono
export { html, raw } from "@hono/hono/html";

// export Sapling class
export { Sapling };

// export functions
export { Layout };

// export serve-static function
export { serveStatic };

// export all types from types/index.ts
export * from "./types/index.ts";

export type { Context } from "./sapling.ts";
export type { LayoutProps } from "./types/index.ts";
