import { init } from "./init.ts";
import { Layout } from "./sapling.ts";

// export html and raw helpers from hono
export { html, raw } from "@hono/hono/html";

// export types
export type { LayoutProps } from "./types/index.ts";

// export functions
export { Layout };

// Add CLI handling for both direct runs and JSR package runs
if (import.meta.main || import.meta.url.includes("jsr.io/@sapling/sapling")) {
  const command = Deno.args[0];

  if (command === "init") {
    await init();
  } else {
    console.error("Unknown command. Available commands: init");
    Deno.exit(1);
  }
}