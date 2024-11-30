import { micromark, type Options } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { codeToHtml } from "shiki";

// Generate GitHub-style heading IDs
function generateId(text: string, prefix?: string): string {
  const baseId = text
    .toLowerCase()
    // Remove HTML tags if present
    .replace(/<[^>]*>/g, '')
    // Remove non-word characters (but keep CJK characters)
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Replace multiple hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Ensure we have a valid ID even if empty
    || 'section';

  return prefix ? `${prefix}-${baseId}` : baseId;
}

interface ThemeOptions {
  light?: string;
  dark?: string;
}

interface MarkdownOptions {
  themes?: ThemeOptions;
  generateHeadingIds?: boolean;
  generateAnchors?: boolean;
  idPrefix?: string;
}

export async function renderMarkdown(
  markdown: string,
  options: MarkdownOptions = {}
): Promise<string> {
  // Only initialize heading tracking if we're generating IDs
  const usedIds = options.generateHeadingIds ? new Set<string>() : null;
  const headings = options.generateHeadingIds ? new Map<number, string>() : null;
  let currentHeadingIndex = -1;
  let currentHeadingText = '';
  let collectingHeading = false;

  // First pass: collect heading text (only if generating IDs)
  if (options.generateHeadingIds) {
    micromark(markdown, {
      allowDangerousHtml: true,
      extensions: [gfm()],
      htmlExtensions: [
        gfmHtml(),
        {
          enter: {
            heading(token: any) {
              currentHeadingIndex = token.index;
              currentHeadingText = '';
              collectingHeading = true;
            },
            text(token: any) {
              if (collectingHeading) {
                currentHeadingText += token.text;
              }
            }
          },
          exit: {
            heading() {
              headings?.set(currentHeadingIndex, currentHeadingText);
              collectingHeading = false;
            }
          }
        }
      ]
    } as Options);
  }

  // Second pass: render with optional IDs and anchors
  let html = micromark(markdown, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [
      gfmHtml(),
      {
        enter: {
          heading(token: any) {
            if (!options.generateHeadingIds) {
              return; // Default heading rendering
            }

            const text = headings?.get(token.index) || '';
            const id = generateId(text, options.idPrefix);

            // Handle duplicate IDs
            let uniqueId = id;
            let counter = 1;
            while (usedIds?.has(uniqueId)) {
              uniqueId = `${id}-${counter}`;
              counter++;
            }
            usedIds?.add(uniqueId);

            // Optionally add GitHub-style anchor link with title attribute
            const anchor = options.generateAnchors
              ? `<a class="anchor" aria-hidden="true" href="#${uniqueId}" title="Direct link to heading"></a>`
              : '';

            return `<h${token.depth} id="${uniqueId}">${anchor}`;
          }
        }
      }
    ]
  } as Options);

  // Process code blocks
  const codeBlocks = html.match(/<code class="language-([^"]+)">([\s\S]*?)<\/code>/g) || [];
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
          light: options.themes?.light || "github-light",
          dark: options.themes?.dark || "github-dark",
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
