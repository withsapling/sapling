import * as path from "@std/path";
import type { PrerenderRoute, PrerenderOptions } from "./index.ts";

/**
 * Generate pre-rendered HTML files for registered routes using Deno's file system APIs
 */
export async function generatePrerenderedPages(
  routes: PrerenderRoute[],
  options: PrerenderOptions
): Promise<void> {
  const { outputDir, createContext } = options;

  // Create output directory if it doesn't exist
  try {
    await Deno.mkdir(outputDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  for (const route of routes) {
    const params = route.params || [{}];

    for (const param of params) {
      let requestPath = route.path;
      // Replace dynamic segments with parameter values
      for (const [key, value] of Object.entries(param)) {
        requestPath = requestPath.replace(`:${key}`, value.toString());
      }

      // Create context with path and params
      const context = createContext(requestPath, param);

      try {
        const response = await route.handler(context);

        if (response instanceof Response && response.ok) {
          const html = await response.text();

          // Create nested directories if needed
          const filePath =
            requestPath === "/"
              ? path.join(outputDir, "index.html")
              : path.join(
                  outputDir,
                  `${
                    requestPath.endsWith("/")
                      ? requestPath.slice(0, -1)
                      : requestPath
                  }.html`
                );

          const fileDir = path.dirname(filePath);
          await Deno.mkdir(fileDir, { recursive: true });

          // Write the HTML file
          await Deno.writeTextFile(filePath, html);
          console.log(`Pre-rendered page: ${filePath}`);
        } else {
          console.error(
            `Error pre-rendering page: ${requestPath} - Response not OK`
          );
        }
      } catch (error) {
        console.error(`Error pre-rendering page: ${requestPath}`, error);
      }
    }
  }
}
