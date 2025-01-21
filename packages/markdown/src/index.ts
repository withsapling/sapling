import { marked } from "marked";
import markedShiki from "marked-shiki";
import { codeToHtml, type BundledLanguage, type BundledTheme, type CodeToHastOptions } from "shiki";
import { gfmHeadingId } from "marked-gfm-heading-id";

type ThemeOptions =
  | { theme: BundledTheme; themes?: never }
  | { theme?: never; themes: { light: BundledTheme; dark: BundledTheme } };

/**
 * Custom type for Shiki options where lang is optional since we handle it internally
 */
type CustomShikiOptions = Omit<CodeToHastOptions<BundledLanguage, BundledTheme>, 'lang' | 'theme' | 'themes'> & ThemeOptions;

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
   * The language (lang) from code blocks will always take precedence over
   * any language specified in shikiOptions.
   * You must provide a theme or themes configuration.
   */
  shikiOptions?: CustomShikiOptions;
}

/**
 * Renders markdown content to HTML with syntax highlighting and GitHub-style features
 * 
 * @example
 * ```ts
 * // Basic usage with a single theme
 * const html = await renderMarkdown("# Hello World", {
 *   shikiOptions: {
 *     theme: "github-light"
 *   }
 * });
 * 
 * // With dark/light theme support
 * const html = await renderMarkdown("# Hello World", {
 *   gfm: true,
 *   idPrefix: "content-",
 *   shikiOptions: {
 *     themes: {
 *       light: "github-light",
 *       dark: "github-dark"
 *     }
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
 * const html = await renderMarkdown(markdown, {
 *   shikiOptions: { theme: "github-light" }
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
        if (!options.shikiOptions?.theme && !options.shikiOptions?.themes) {
          throw new Error('You must provide either a theme or themes in shikiOptions');
        }
        return await codeToHtml(code, {
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