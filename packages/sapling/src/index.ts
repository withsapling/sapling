import { Sapling } from "./sapling.ts";
import { Layout } from "./sapling-layout.ts";
import { serveStatic } from "./serve-static/index.ts";
import { SaplingIsland } from "./sapling-island.ts";

// export html and raw helpers from hono
export { html, raw } from "@hono/hono/html";

// export Sapling class
export { Sapling };

// export functions
export { Layout };

// export serve-static function
export { serveStatic };

// export SaplingIsland
export { SaplingIsland };

// export types
export type { LayoutProps, HtmlContent, Context } from "./types/index.ts";