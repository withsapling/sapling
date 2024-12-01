import { marked } from "marked";
import markedShiki from "marked-shiki";
import { codeToHtml } from "shiki";
import { gfmHeadingId } from "marked-gfm-heading-id";

interface ThemeOptions {
  light?: string;
  dark?: string;
}

interface MarkdownOptions {
  themes?: ThemeOptions;
  generateHeadingIds?: boolean;
  generateAnchors?: boolean;
  idPrefix?: string;
  gfm?: boolean;
  breaks?: boolean;
}

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
        codeToHtml(code, { lang: lang || "text", theme: "github-light" }),
    }),
  );

  marked.use(
    gfmHeadingId({
      prefix: options.idPrefix ?? undefined,
    }),
  );

  return marked(markdown);
}
