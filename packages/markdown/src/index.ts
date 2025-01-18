/**
 * Markdown rendering with syntax highlighting and GitHub-style features
 */

import { Marked } from "marked";
import markedShiki from "marked-shiki";
import { createHighlighter, type BundledTheme } from "shiki";
import { gfmHeadingId } from "marked-gfm-heading-id";

/** 
 * Options for configuring syntax highlighting themes
 * @interface
 */
export interface ThemeOptions {
  /** Light theme name */
  light?: BundledTheme;
  /** Dark theme name */
  dark?: BundledTheme;
  /** Dim theme name */
  dim?: BundledTheme;
  /** Additional theme variants */
  [key: string]: BundledTheme | undefined;
}

/**
 * Configuration options for Shiki syntax highlighting
 * @interface
 */
export interface ShikiOptions {
  /** Theme configuration for different color modes */
  themes?: ThemeOptions;
  /** Default color mode to use */
  defaultColor?: string;
  /** CSS variable prefix */
  cssVariablePrefix?: string;
  /** Languages to load for syntax highlighting */
  langs?: string[];
}

/**
 * Configuration options for markdown rendering
 * @interface
 */
export interface MarkdownOptions {
  /** Whether to generate anchor links for headings */
  generateAnchors?: boolean;
  /** Prefix to use for heading IDs */
  idPrefix?: string;
  /** Whether to use GitHub Flavored Markdown */
  gfm?: boolean;
  /** Whether to use line breaks */
  breaks?: boolean;
  /** Shiki syntax highlighting configuration */
  shiki?: ShikiOptions;
}

/**
 * Renders markdown content to HTML with syntax highlighting
 * @param markdown - The markdown string to render
 * @param options - Configuration options for the markdown renderer
 * @returns A promise that resolves to the rendered HTML string
 * 
 * @example
 * ```ts
 * import { renderMarkdown } from '@sapling/markdown'
 * 
 * // Basic usage
 * const html = await renderMarkdown('# Hello World')
 * 
 * // With syntax highlighting options
 * const html = await renderMarkdown('```js\nconst x = 1;\n```', {
 *   shiki: {
 *     themes: {
 *       light: 'github-light',
 *       dark: 'github-dark'
 *     }
 *   }
 * })
 * 
 * // With GitHub-style heading IDs
 * const html = await renderMarkdown('## My Heading', {
 *   idPrefix: 'custom-',
 *   gfm: true
 * })
 * ```
 */
export async function renderMarkdown(
  markdown: string,
  options: MarkdownOptions = {},
): Promise<string> {
  const defaultTheme = "github-light" as BundledTheme;
  const themes = options.shiki?.themes || { light: defaultTheme };
  const themeNames = Object.values(themes).filter((t): t is BundledTheme => t !== undefined);

  const defaultLangs = ['md', 'js', 'ts', 'json', 'html', 'css'];
  const langs = options.shiki?.langs || defaultLangs;

  const highlighter = await createHighlighter({
    themes: themeNames.length > 0 ? themeNames : [defaultTheme],
    langs,
  });

  // Configure marked options
  const renderer = new Marked()
    .use({
      gfm: options.gfm ?? true,
      breaks: options.breaks ?? false,
    })
    .use(
      markedShiki({
        highlight(code: string, lang: string) {
          return highlighter.codeToHtml(code, {
            lang: lang || "text",
            theme: (options.shiki?.themes?.light || defaultTheme) as BundledTheme,
          });
        },
      }),
    )
    .use(
      gfmHeadingId({
        prefix: options.idPrefix ?? undefined,
      }),
    );

  return renderer.parse(markdown);
}
