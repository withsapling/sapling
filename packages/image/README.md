# @sapling/image

A powerful image optimization library for Deno that makes it easy to process and optimize images in various formats and sizes.

## Features

- 🖼️ Process both individual images and entire directories
- 📏 Generate multiple sizes of each image (small, medium, large)
- 🎨 Support for multiple output formats (AVIF, WebP, JPEG, PNG)
- ⚡ Efficient processing with WASM-based optimization
- 🔄 Skip existing files to avoid redundant processing
- ⚙️ Highly configurable with custom sizes and quality settings

## Installation

```ts
import { optimizeImages } from "@sapling/image";
```

## Usage

### Basic Usage

```ts
await optimizeImages({
  entries: [
    {
      input: "src/images/gallery",
      output: "static/images/gallery"
    },
    {
      input: "src/images/hero.jpg",
      output: "static/images/home"
    }
  ]
});
```

### Advanced Configuration

```ts
await optimizeImages({
  entries: [
    {
      input: "src/images/gallery",
      output: "static/images/gallery"
    }
  ],
  // Custom sizes with different quality settings
  sizes: [
    { suffix: "sm", width: 640, quality: 80 },
    { suffix: "md", width: 1280, quality: 85 },
    { suffix: "lg", width: 1920, quality: 90 }
  ],
  // Choose output format
  format: "webp",
  // Set default quality for sizes without specific quality
  defaultQuality: 85
});
```

## Configuration Options

### OptimizeImagesConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entries` | `Array<{input: string, output: string}>` | Required | Array of input/output path pairs |
| `sizes` | `ImageSize[]` | See below | Array of size configurations |
| `format` | `"avif" \| "webp" \| "jpeg" \| "png"` | `"avif"` | Output format for all images |
| `defaultQuality` | `number` | `85` | Default quality setting (1-100) |

### Default Sizes

```ts
const DEFAULT_SIZES = [
  { suffix: "sm", width: 640 },
  { suffix: "md", width: 1280 },
  { suffix: "lg", width: 1920 }
];
```

### ImageSize Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `suffix` | `string` | Yes | Suffix added to the filename (e.g., "-sm") |
| `width` | `number` | Yes | Target width in pixels |
| `quality` | `number` | No | Optional quality override (1-100) |

## Supported Input Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- AVIF (.avif)

## Output

The library will create optimized versions of your images with the following naming convention:

```
{original-name}-{size-suffix}.{format}
```

Example:
- Input: `hero.jpg`
- Output: `hero-sm.webp`, `hero-md.webp`, `hero-lg.webp`

## Progress Tracking

The library provides detailed console output during processing:

- ✅ Successfully optimized images
- ⏭️ Skipped existing files
- ❌ Error messages for failed optimizations
- ⏱️ Total processing time

## Error Handling

The library includes comprehensive error handling:
- Skips files that already exist
- Reports detailed error messages for failed optimizations
- Creates output directories automatically
- Validates input paths and formats
