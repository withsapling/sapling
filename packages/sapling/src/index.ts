import { Sapling } from "./sapling.ts";
import { Layout } from "./sapling-layout.ts";
import { serveStatic } from "./serve-static/index.ts";

export { html, raw } from "./html/index.ts";

// export Sapling class
export { Sapling };

// export functions
export { Layout };

// export serve-static function
export { serveStatic };

// export prerender types
export type { PrerenderRoute, PrerenderOptions } from "./prerender/index.ts";

// export all types from types/index.ts
export * from "./types/index.ts";

export type { Context } from "./sapling.ts";
export type { LayoutProps } from "./types/index.ts";
