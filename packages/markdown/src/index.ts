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
  /** 
   * Options passed directly to shiki's codeToHtml.
   * Defaults that can be overridden:
   * - themes: Defaults to { light: "github-light", dark: "github-dark" }
   * Note: The language (lang) from code blocks will always take precedence over
   * any language specified in shikiOptions
   */
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
 *     // Theme customization
 *     theme: "dracula",
 *     // Language handling:
 *     // 1. Code blocks with explicit language will use that language: ```ts
 *     // 2. Code blocks with no language will fallback to "text": ```
 *   }
 * });
 * 
 * // Language examples
 * const markdown = `
 * \`\`\`typescript
 * // This will use TypeScript highlighting
 * const x: number = 42;
 * \`\`\`
 * 
 * \`\`\`
 * // This will fallback to text highlighting
 * const x = 42;
 * \`\`\`
 * `;
 * const html = await renderMarkdown(markdown);
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
          // Set defaults first
          themes: {
            light: "github-light",
            dark: "github-dark"
          },
          // Allow shikiOptions to override defaults
          ...options.shikiOptions,
          // Always ensure code block language takes precedence
          lang: lang || "text",
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