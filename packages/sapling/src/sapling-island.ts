// This is intended to be used client side so we are loading in the dom types

/**
 * @class SaplingIsland - A custom element for loading scripts with various loading strategies
 * @extends HTMLElement
 *
 * example:
 * <sapling-island src="https://example.com/script.js" loading="onvisible" timeout="10000"></sapling-island>
 */
export class SaplingIsland extends HTMLElement {
  loaded: boolean;
  observer: IntersectionObserver | null;
  timeoutId: number | null;
  mediaQuery: MediaQueryList | null;
  mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null;

  constructor() {
    super();
    this.loaded = false;
    this.observer = null;
    this.timeoutId = null;
    this.mediaQuery = null;
    this.mediaQueryHandler = null;
  }

  // Attributes that trigger attributeChangedCallback
  static get observedAttributes(): string[] {
    return ["src", "type", "loading", "timeout"];
  }

  connectedCallback() {
    this.style.display = "contents";

    // Default to onload if no loading strategy specified
    const loadingStrategy = this.getAttribute("loading") || "onload";

    // Check if loading attribute is a media query
    if (loadingStrategy.includes("(") && loadingStrategy.includes(")")) {
      this.setupMediaLoading(loadingStrategy);
      return;
    }

    switch (loadingStrategy) {
      case "onvisible":
        this.setupVisibilityLoading();
        break;

      case "idle":
        this.loadWhenIdle();
        break;

      default: // "onload"
        this.loadScript();
    }
  }

  // Load script when browser is idle or after window load
  loadWhenIdle() {
    // Setup timeout
    const timeoutAttr = this.getAttribute("timeout");
    // Parse timeout
    const timeout = timeoutAttr ? parseInt(timeoutAttr) : null;
    // Check if timeout is valid and greater than 0
    const options = timeout && !isNaN(timeout) && timeout > 0 ? { timeout } : undefined;

    if ("requestIdleCallback" in globalThis) {
      globalThis.requestIdleCallback(() => this.loadScript(), options);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      globalThis.addEventListener("load", () => {
        // Add a small delay after load to lower priority
        setTimeout(() => this.loadScript(), 0);
      });
    }
  }

  // Load script when element becomes visible or timeout is reached
  setupVisibilityLoading() {
    // Setup timeout
    const timeoutAttr = this.getAttribute("timeout");
    // Parse timeout
    const timeout = timeoutAttr ? parseInt(timeoutAttr) : null;
    // Check if timeout is valid and greater than 0
    if (timeout && !isNaN(timeout) && timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.loadScript();
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      }, timeout);
    }

    // Create intersection observer to detect when element enters viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loaded) {
            if (this.timeoutId) {
              clearTimeout(this.timeoutId);
              this.timeoutId = null;
            }
            this.loadScript();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0,
      }
    );

    this.observer.observe(this);
  }

  // Cleanup when element is removed from DOM
  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.mediaQuery && !this.loaded && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener("change", this.mediaQueryHandler);
    }
  }

  // Create and load the script element
  async loadScript() {
    const src = this.getAttribute("src");
    if (!src || this.loaded) {
      return;
    }

    try {
      this.loaded = true;
      const script = document.createElement("script");
      script.src = src;

      // Handle module scripts
      const scriptType = this.getAttribute("type") || "module";
      if (scriptType === "module") {
        script.type = "module";
      }

      // Wait for script to load before dispatching event
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          resolve();
        };
        script.onerror = (error) => {
          reject(error);
        };
        document.head.appendChild(script);
      });

      this.dispatchEvent(
        new CustomEvent("island:loaded", {
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent("island:error", {
          bubbles: true,
          composed: true,
          detail: error,
        })
      );
    }
  }

  // Load script when media query matches
  setupMediaLoading(query: string) {
    this.mediaQuery = globalThis.matchMedia(query);

    this.mediaQueryHandler = (e) => {
      if (e.matches && !this.loaded) {
        this.loadScript();
        // Cleanup listener after loading
        if (this.mediaQuery && this.mediaQueryHandler) {
          this.mediaQuery.removeEventListener("change", this.mediaQueryHandler);
        }
      }
    };

    // Check initial state
    if (this.mediaQuery.matches) {
      this.loadScript();
    } else {
      // Listen for changes if initial state doesn't match
      this.mediaQuery.addEventListener("change", this.mediaQueryHandler);
    }
  }
}

customElements.define("sapling-island", SaplingIsland);
