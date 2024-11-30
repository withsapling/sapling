# Sapling

A Modern SSR framework for generating content-first websites. 

 - Multi-runtime, meaning you can use it with [Deno](https://deno.com/), [Node](https://nodejs.org/), [Bun](https://bun.sh/), and [Cloudflare Workers](https://developers.cloudflare.com/workers/). 
 - Support for Tailwind CSS via [UnoCSS](https://github.com/unocss/unocss).
 - Completely buildless meaning it has no build step and does not rely on a bundler.


## Getting Started  

Deno

```bash
deno -A jsr:@sapling/create
```

Node

```bash
npm create sapling@latest
```

Bun

```bash
bunx create-sapling@latest
```

## Packages

| Package | Description | Version |
|---------|-------------|-----|
| [sapling](./packages/sapling/) | A micro SSR framework | [![JSR](https://jsr.io/badges/@sapling/sapling)](https://jsr.io/@sapling/sapling) |
| [router](./packages/router/) | A micro router for Sapling sites or Deno projects | [![JSR](https://jsr.io/badges/@sapling/router)](https://jsr.io/@sapling/router) |
| [create](./packages/create/) | A CLI for creating Sapling projects | [![JSR](https://jsr.io/badges/@sapling/create)](https://jsr.io/@sapling/create) |
| [markdown](./packages/markdown/) | A markdown parser for Sapling sites or Deno projects | [![JSR](https://jsr.io/badges/@sapling/markdown)](https://jsr.io/@sapling/markdown) |
| [create-sapling](./packages/create-sapling/) | A CLI for creating Sapling projects with npm | [![npm](https://img.shields.io/npm/v/create-sapling.svg)](https://www.npmjs.com/package/create-sapling) |


## Examples

We would recommend checking out the [Sapling Examples Repository](https://github.com/withsapling/examples) for more examples of how to use Sapling.

## Attributions

- [Hono](https://github.com/honojs/hono) - We use Hono's amazing HTML helpers for escaping HTML templates. We're also huge fans of their routing approach which is why we've borrowed some of their ideas for Sapling.
- [UnoCSS](https://github.com/unocss/unocss) - We use UnoCSS for atomic CSS.
- [micromark](https://github.com/micromark/micromark) - Our markdown parser.
- [shiki](https://github.com/shikijs/shiki) - The code highlighter for syntax highlighting.
