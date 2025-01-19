import { marked } from "marked";
import markedShiki from "marked-shiki";
import { codeToHtml } from "shiki";
import { gfmHeadingId } from "marked-gfm-heading-id";

/**
 * Options for markdown rendering
 */
interface MarkdownOptions {
  /** Prefix for heading IDs */
  idPrefix?: string;
  /** Enable GitHub Flavored Markdown. Defaults to true */
  gfm?: boolean;
  /** Convert \n to <br>. Defaults to false */
  breaks?: boolean;
  /** Options passed directly to shiki's codeToHtml. Will override defaults (github-light theme and text fallback language) */
  shikiOptions?: Parameters<typeof codeToHtml>[1];
}

/**
 * Renders markdown content to HTML with syntax highlighting and GitHub-style features
 * 
 * @example
 * ```ts
 * // Basic usage
 * const html = await renderMarkdown("# Hello World");
 * 
 * // With options
 * const html = await renderMarkdown("# Hello World", {
 *   gfm: true,
 *   idPrefix: "content-",
 *   shikiOptions: {
 *     theme: "dracula",
 *     langs: ["typescript", "javascript"]
 *   }
 * });
 * ```
 * 
 * @param markdown - The markdown string to render
 * @param options - Rendering options
 * @returns Promise resolving to the rendered HTML
 */
export async function renderMarkdown(
  markdown: string,
  options: MarkdownOptions = {},
): Promise<string> {
  // Configure marked options
  await marked.use({
    gfm: options.gfm ?? true,
    breaks: options.breaks ?? false,
  });

  await marked.use(
    markedShiki({
      async highlight(code: string, lang: string) {
        return await codeToHtml(code, {
          lang: lang || "text",
          theme: "github-light",
          ...options.shikiOptions,
        });
      },
    }),
  );

  await marked.use(
    gfmHeadingId({
      prefix: options.idPrefix ?? undefined,
    }),
  );

  return marked(markdown);
}