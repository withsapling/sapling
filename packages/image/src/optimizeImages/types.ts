/**
 * Configuration for a specific image size output.
 */
export interface ImageSize {
  /** Suffix to append to the filename (e.g., "sm" for small) */
  suffix: string;
  /** Target width in pixels for this size variant */
  width: number;
  /** Optional quality setting (1-100). Falls back to defaultQuality if not specified */
  quality?: number;
}

/**
 * Configuration for the image optimization process.
 */
export interface OptimizeImagesConfig {
  /** Array of input/output directory pairs to process */
  entries: Array<{
    /** Source directory or file path */
    input: string;
    /** Output directory path for optimized images */
    output: string;
  }>;
  /** Optional array of size configurations. Falls back to default sizes if not specified */
  sizes?: ImageSize[];
  /** Optional output format. Defaults to "avif" */
  format?: "avif" | "webp" | "jpeg" | "png";
  /** Optional default quality setting (1-100). Defaults to 85 */
  defaultQuality?: number;
}
