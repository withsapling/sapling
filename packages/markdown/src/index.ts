import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { codeToHtml } from "shiki";

interface ThemeOptions {
  theme?: string;
  light?: string;
  dark?: string;
}

export async function renderMarkdown(
  markdown: string,
  themes?: ThemeOptions
): Promise<string> {
  // Process markdown
  let html = micromark(markdown, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });

  // Find all code blocks
  const codeBlocks =
    html.match(/<code class="language-([^"]+)">([\s\S]*?)<\/code>/g) || [];

  // Process each code block
  for (const block of codeBlocks) {
    const match = block.match(
      /<code class="language-([^"]+)">([\s\S]*?)<\/code>/,
    );
    if (!match) continue;

    const [fullMatch, lang, code] = match;
    try {
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"');

      const highlighted = await codeToHtml(decodedCode, {
        lang,
        theme: themes?.theme,
        themes: {
          light: themes?.light || "github-light",
          dark: themes?.dark || "github-dark",
        },
      });

      // Extract just the code content from within Shiki's pre/code tags
      const codeContent =
        highlighted.match(/<code[^>]*>([\s\S]*)<\/code>/)?.[1] || highlighted;

      // Wrap in a div that contains both the highlighted code and the original text
      const wrappedCode = `
      <code class="language-${lang}">${codeContent}</code>
     `;

      html = html.replace(fullMatch, wrappedCode);
    } catch (e) {
      console.warn(`Failed to highlight ${lang}:`, e);
    }
  }

  return html;
}
