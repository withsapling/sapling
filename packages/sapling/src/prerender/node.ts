// import * as path from "node:path";
// import * as fs from "node:fs/promises";
// import * as os from "node:os";
// import type { PrerenderRoute, PrerenderOptions } from "./index.ts";

// type NodeError = {
//   code?: string;
//   [key: string]: unknown;
// };

// /**
//  * Build pre-rendered HTML files for registered routes using Node.js file system APIs
//  */
// export async function buildPrerenderRoutes(
//   routes: PrerenderRoute[],
//   options: PrerenderOptions
// ): Promise<void> {
//   const { outputDir, createContext } = options;

//   // Create output directory if it doesn't exist
//   try {
//     await fs.mkdir(outputDir, { recursive: true });
//   } catch (error) {
//     const nodeError = error as NodeError;
//     if (nodeError?.code !== "EEXIST") {
//       throw error;
//     }
//   }

//   // Create a flat list of all pages to render
//   const pages = routes.flatMap((route) => {
//     const params = route.params || [{}];
//     return params.map((param) => {
//       let requestPath = route.path;
//       // Replace dynamic segments with parameter values
//       for (const [key, value] of Object.entries(param)) {
//         requestPath = requestPath.replace(`:${key}`, value.toString());
//       }
//       return { route, param, requestPath };
//     });
//   });

//   // Smart concurrency based on page count
//   const concurrencyLimit = Math.min(
//     Math.max(2, Math.ceil(pages.length / 4)),
//     os.cpus().length || 4
//   );

//   console.log(
//     `\nPrerendering ${pages.length} pages with ${concurrencyLimit} workers...`
//   );
//   const startTime = Date.now();
//   let completed = 0;

//   // Process pages in parallel with a concurrency limit
//   const chunks = [];
//   for (let i = 0; i < pages.length; i += concurrencyLimit) {
//     chunks.push(pages.slice(i, i + concurrencyLimit));
//   }

//   for (const chunk of chunks) {
//     await Promise.all(
//       chunk.map(async ({ route, param, requestPath }) => {
//         // Create context with path and params
//         const context = createContext(requestPath, param);

//         try {
//           // Create middleware chain
//           let index = 0;
//           const allMiddleware = route.middleware;

//           const executeMiddleware = async (): Promise<Response | null> => {
//             if (index < allMiddleware.length) {
//               const middleware = allMiddleware[index++];
//               return await middleware(context, executeMiddleware);
//             } else {
//               return await route.handler(context);
//             }
//           };

//           const response = await executeMiddleware();

//           if (response instanceof Response && response.ok) {
//             const html = await response.text();

//             // Create nested directories if needed
//             const filePath =
//               requestPath === "/"
//                 ? path.join(outputDir, "index.html")
//                 : path.join(
//                     outputDir,
//                     `${
//                       requestPath.endsWith("/")
//                         ? requestPath.slice(0, -1)
//                         : requestPath
//                     }.html`
//                   );

//             const fileDir = path.dirname(filePath);
//             await fs.mkdir(fileDir, { recursive: true });

//             // Write the HTML file
//             await fs.writeFile(filePath, html);
//             completed++;
//             const percent = Math.round((completed / pages.length) * 100);
//             console.log(`[${percent}%] Pre-rendered: ${filePath}`);
//           } else {
//             console.error(
//               `Error pre-rendering page: ${requestPath} - Response not OK`
//             );
//           }
//         } catch (error) {
//           console.error(`Error pre-rendering page: ${requestPath}`, error);
//         }
//       })
//     );
//   }

//   const duration = Date.now() - startTime;
//   console.log(`\nPrerendered ${completed} pages in ${duration}ms`);
// }
