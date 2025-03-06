// Re-export types
export * from "./types.ts";

// Detect runtime and export appropriate implementation
const isDeno = typeof Deno !== "undefined";

// Import the appropriate implementation
const implementation = isDeno
  ? await import("./deno.ts")
  : await import("./node.ts");

export const { optimizeImages } = implementation;
