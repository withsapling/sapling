import { html } from "hono/html";

export function BaseHead({
  title = "Sapling Chat",
  description = "Sapling Chat - A modern AI chat application built with Sapling framework",
}) {
  return html`
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="stylesheet" href="/styles/main.css" />
    
    <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
    <style>
      :root {
        --color-primary: #000;
        --color-on-primary: #fff;
        --color-secondary: #fff;
      }
      ::selection {
        background-color: var(--color-primary);
        color: var(--color-on-primary);
      }
      
      /* Markdown prose styles */
      .prose {
        max-width: none;
      }
      .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        margin-top: 0.5em;
        margin-bottom: 0.25em;
        font-weight: 600;
      }
      .prose p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }
      .prose ul, .prose ol {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
        padding-left: 1.25em;
      }
      .prose li {
        margin-top: 0.125em;
        margin-bottom: 0.125em;
      }
      .prose code {
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.125em 0.25em;
        border-radius: 0.25em;
        font-size: 0.875em;
      }
      .prose pre {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0.5em;
        border-radius: 0.375em;
        overflow-x: auto;
        margin: 0.5em 0;
      }
      .prose pre code {
        background-color: transparent;
        padding: 0;
      }
      .prose blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1em;
        margin: 0.5em 0;
        font-style: italic;
      }
      .prose strong {
        font-weight: 600;
      }
      .prose em {
        font-style: italic;
      }
    </style>
  `;
}
