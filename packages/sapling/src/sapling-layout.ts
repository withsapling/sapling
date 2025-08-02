import type { LayoutProps } from "./types/index.ts";
import { SAPLING_VERSION } from "./constants.ts";
import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

/**
 * The Layout function creates an HTML document.
 *
 * @returns A Promise that resolves to the complete HTML document as a string or a ReadableStream that streams the HTML document
 *
 * @param props - The properties for the layout
 * @param props.head - Additional content to inject into the document's head section
 * @param props.bodyClass - Optional class string to add to the body element
 * @param props.children - The content to render in the body of the page
 * @param props.enableIslands - When true, adds the islands script and CSS
 * @param props.lang - Optional language for the HTML document
 * @param props.disableGeneratorTag - When true, skips the generator meta tag
 *
 * @example
 * ```ts
 * // Basic usage (non-streaming)
 * const html = await Layout({ children: html`<h1>Hello World</h1>` });
 * ```
 */
export function Layout(props: LayoutProps): HtmlEscapedString | Promise<HtmlEscapedString> {
      // Return the HTML as a string
      return html`
        <!DOCTYPE html>
        <html lang="${props.lang || "en"}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${
            props.disableGeneratorTag
              ? ""
              : raw(`<meta name="generator" content="Sapling v${SAPLING_VERSION}">`)  
          }
          ${
            props.enableIslands
              ? raw(`
          <!-- Sapling Islands -->
          <script type="module" src="https://sapling-is.land"></script>
          <style>sapling-island{display:contents}</style>
          `)
              : ""
          }
          ${props.head}
        </head>
        ${props.bodyClass ? raw(`<body class="${props.bodyClass}">`) : raw(`<body>`)}
          ${props.children}
        </body>
        </html>
      `;
}
