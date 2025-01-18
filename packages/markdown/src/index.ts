import { marked } from "marked";
import markedShiki from "marked-shiki";
import { codeToHtml } from "shiki";
import { gfmHeadingId } from "marked-gfm-heading-id";

/** 
 * Options for configuring syntax highlighting themes
 * @interface
 */
export interface ThemeOptions {
  /** Light theme name */
  light?: string;
  /** Dark theme name */
  dark?: string;
  /** Dim theme name */
  dim?: string;
  /** Additional theme variants */
  [key: string]: string | undefined;
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
  /** Prefix for CSS variables */
  cssVariablePrefix?: string;
}

/**
 * Configuration options for markdown rendering
 * @interface
 */
export interface MarkdownOptions {
  /** Theme configuration for syntax highlighting */
  themes?: ThemeOptions;
  /** Whether to generate IDs for headings */
  generateHeadingIds?: boolean;
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
 */
export function renderMarkdown(
  markdown: string,
  options: MarkdownOptions = {},
): string | Promise<string> {
  // Configure marked options
  marked.use({
    gfm: options.gfm ?? true,
    breaks: options.breaks ?? false,
  });

  marked.use(
    markedShiki({
      highlight: (code: string, lang: string) =>
        codeToHtml(code, {
          lang: lang || "text",
          themes: options.shiki?.themes || { light: "github-light" },
          defaultColor: options.shiki?.defaultColor,
          cssVariablePrefix: options.shiki?.cssVariablePrefix,
        }),
    }),
  );

  marked.use(
    gfmHeadingId({
      prefix: options.idPrefix ?? undefined,
    }),
  );

  return marked(markdown);
}
