import type { OptimizeImagesConfig } from "./types.ts";

// Re-export types
export * from "./types.ts";

let optimizeImages: (config: OptimizeImagesConfig) => Promise<void>;

// Check if we're running in Deno
if (typeof Deno !== "undefined") {
  optimizeImages = (await import("./deno.ts")).optimizeImages;
} else {
  optimizeImages = (await import("./node.ts")).optimizeImages;
}

export { optimizeImages };
