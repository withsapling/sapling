[![JSR](https://jsr.io/badges/@sapling/markdown)](https://jsr.io/@sapling/markdown)

# Sapling Markdown Package  

This package contains the markdown parser and renderer that can be used in Sapling websites or other Deno projects.

## Usage

```ts
import { renderMarkdown } from "@sapling/markdown";

// Render markdown to html
const html = await renderMarkdown(markdown);
```

## Attributions

- [marked](https://github.com/markedjs/marked) - The markdown parser
- [shiki](https://github.com/shikijs/shiki) - The code highlighter