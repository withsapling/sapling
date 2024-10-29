interface CachedFile {
  readable: ReadableStream;
  size: number;
  hash: string;
  close: () => void;
}

export class StaticFileCache {
  private cache = new Map<string, CachedFile>();

  /**
   * Reads and potentially caches a file
   */
  async readFile(filePath: string): Promise<CachedFile | null> {
    try {
      // Check if file exists in cache
      const existingCache = this.cache.get(filePath);
      if (existingCache) {
        return existingCache;
      }

      // Open and read the file
      const file = await Deno.open(filePath, { read: true });
      const fileInfo = await file.stat();
      
      // Create a hash from the last modified time and size
      const hash = await this.createHash(fileInfo);
      
      // Create a new cached entry
      const cached: CachedFile = {
        readable: file.readable,
        size: fileInfo.size,
        hash,
        close: () => file.close(),
      };

      this.cache.set(filePath, cached);
      return cached;
    } catch {
      return null;
    }
  }

  /**
   * Creates response headers for caching
   */
  createCacheHeaders(file: CachedFile, dev = false): Headers {
    const headers = new Headers({
      'Vary': 'If-None-Match',
      'Content-Length': String(file.size),
    });

    if (dev) {
      // Disable caching in development
      headers.set(
        'Cache-Control',
        'no-cache, no-store, max-age=0, must-revalidate'
      );
    } else {
      // Enable caching in production
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', `W/"${file.hash}"`);
    }

    return headers;
  }

  /**
   * Checks if the request matches the ETag
   */
  isNotModified(req: Request, file: CachedFile): boolean {
    const ifNoneMatch = req.headers.get('If-None-Match');
    if (!ifNoneMatch) return false;

    return ifNoneMatch === `W/"${file.hash}"` || 
           ifNoneMatch === file.hash;
  }

  private async createHash(fileInfo: Deno.FileInfo): Promise<string> {
    // Create a unique hash based on file metadata
    const data = `${fileInfo.mtime?.getTime() ?? ''}-${fileInfo.size}`;
    const hash = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(data)
    );
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Clears the cache
   */
  clear(): void {
    for (const cached of this.cache.values()) {
      cached.close();
    }
    this.cache.clear();
  }
}
