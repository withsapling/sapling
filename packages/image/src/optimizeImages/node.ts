import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { optimizeImage } from "wasm-image-optimization";
import type { ImageSize, OptimizeImagesConfig } from "./types.ts";
import { walk } from "jsr:@std/fs";

// Default configurations
const DEFAULT_SIZES: ImageSize[] = [
  { suffix: "sm", width: 640 },
  { suffix: "md", width: 1280 },
  { suffix: "lg", width: 1920 },
];

const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/**
 * Optimizes images according to the provided configuration.
 * This function will process either single images or entire directories,
 * creating multiple sizes of each image in the specified format.
 *
 * @param {OptimizeImagesConfig} config - Configuration object for image optimization
 * @returns {Promise<void>} A promise that resolves when all images have been processed
 *
 * @example
 * ```ts
 * await optimizeImages({
 *   entries: [{ input: "./images", output: "./optimized" }],
 *   format: "avif",
 *   sizes: [{ suffix: "sm", width: 640 }]
 * });
 * ```
 */
export async function optimizeImages(config: OptimizeImagesConfig) {
  const startTime = performance.now();
  const sizes = config.sizes || DEFAULT_SIZES;
  const format = config.format || "avif";
  const defaultQuality = config.defaultQuality || 85;

  for (const entry of config.entries) {
    const inputStats = await stat(entry.input);
    await mkdir(entry.output, { recursive: true });

    if (inputStats.isDirectory()) {
      // Process directory
      for await (const file of walk(entry.input, {
        exts: SUPPORTED_FORMATS.map((ext) => ext.slice(1)),
      })) {
        if (file.isFile) {
          await processImage(
            file.path,
            entry.input,
            entry.output,
            sizes,
            format,
            defaultQuality
          );
        }
      }
    } else if (inputStats.isFile()) {
      // Process single file
      await processImage(
        entry.input,
        dirname(entry.input),
        entry.output,
        sizes,
        format,
        defaultQuality
      );
    }
  }

  const endTime = performance.now();
  const elapsedTime = (endTime - startTime) / 1000;
  console.log(
    `⏱️  Image optimization completed in ${elapsedTime.toFixed(2)} seconds`
  );
}

/**
 * Processes a single image file, creating multiple sized versions according to the configuration.
 *
 * @param {string} filePath - Path to the source image file
 * @param {string} basePath - Base directory path for calculating relative paths
 * @param {string} outputPath - Directory where optimized images will be saved
 * @param {ImageSize[]} sizes - Array of size configurations to generate
 * @param {"avif" | "webp" | "jpeg" | "png"} format - Output format for the optimized images
 * @param {number} defaultQuality - Default quality setting for optimization (1-100)
 * @returns {Promise<void>} A promise that resolves when the image has been processed
 * @private
 */
async function processImage(
  filePath: string,
  basePath: string,
  outputPath: string,
  sizes: ImageSize[],
  format: "avif" | "webp" | "jpeg" | "png",
  defaultQuality: number
) {
  const relativePath = relative(basePath, filePath);
  const baseName = relativePath.replace(/\.[^/.]+$/, "");

  for (const size of sizes) {
    const outputFilePath = join(
      outputPath,
      `${baseName}-${size.suffix}.${format}`
    );

    // Skip if this size already exists
    try {
      await stat(outputFilePath);
      console.log(
        `⏭️  Skipping: ${relativePath} -> ${format} (${size.suffix}) - exists`
      );
      continue;
    } catch {
      // File doesn't exist, proceed with optimization
    }

    try {
      const imageData = await readFile(filePath);
      const optimizedImage = await optimizeImage({
        image: imageData,
        width: size.width,
        quality: size.quality || defaultQuality,
        format,
      });

      if (optimizedImage) {
        await mkdir(dirname(outputFilePath), { recursive: true });
        await writeFile(outputFilePath, optimizedImage);
        console.log(
          `✅ Optimized: ${relativePath} -> ${format} (${size.suffix})`
        );
      } else {
        console.error(
          `❌ Failed to optimize ${relativePath} (${size.suffix}): No output generated`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${relativePath} (${size.suffix}):`,
        error
      );
    }
  }
}
