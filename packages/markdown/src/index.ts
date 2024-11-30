import { micromark, type Options } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { codeToHtml } from "shiki";

// Generate GitHub-style heading IDs
function generateId(text: string): string {
  return text
    .toLowerCase()
    // Remove non-word characters
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with a single hyphen
    .replace(/-+/g, '-')
    .trim();
}

interface ThemeOptions {
  light?: string;
  dark?: string;
}

export async function renderMarkdown(
  markdown: string,
  themes?: ThemeOptions
): Promise<string> {
  // Track used IDs to ensure uniqueness
  const usedIds = new Set<string>();

  // First pass: collect heading text
  const headings = new Map<number, string>(); // token index to text
  let currentHeadingIndex = -1;
  let collectingHeading = false;

  micromark(markdown, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [
      gfmHtml(),
      {
        enter: {
          heading(token) {
            currentHeadingIndex = token.index;
            collectingHeading = true;
          },
          text(token) {
            if (collectingHeading) {
              headings.set(currentHeadingIndex, token.text);
            }
          }
        },
        exit: {
          heading() {
            collectingHeading = false;
          }
        }
      }
    ]
  } as Options);

  // Second pass: render with IDs
  let html = micromark(markdown, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [
      gfmHtml(),
      {
        enter: {
          heading(token) {
            const text = headings.get(token.index) || '';
            const id = generateId(text);

            // Handle duplicate IDs
            let uniqueId = id;
            let counter = 1;
            while (usedIds.has(uniqueId)) {
              uniqueId = `${id}-${counter}`;
              counter++;
            }
            usedIds.add(uniqueId);

            this.tag(`<h${token.depth} id="${uniqueId}">`);
            return;
          }
        }
      }
    ]
  } as Options);

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
