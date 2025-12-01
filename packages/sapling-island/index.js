// LICENSE: MIT
// Version: 0.2.1

export default class SaplingIsland extends HTMLElement {
  constructor() {
    super();
    this.loaded = false;
    this.observer = null;
    this.timeoutId = null;
    this.mediaQuery = null;
  }

  // Attributes that trigger attributeChangedCallback
  static get observedAttributes() {
    return ["loading", "timeout"];
  }

  connectedCallback() {
    // Default to onload if no loading strategy specified
    const loadingStrategy = this.getAttribute("loading") || "onload";

    // Check if loading attribute is a media query
    if (loadingStrategy.includes("(") && loadingStrategy.includes(")")) {
      this.setupMediaLoading(loadingStrategy);
      return;
    }

    switch (loadingStrategy) {
      case "visible":
        this.setupVisibilityLoading();
        break;

      case "idle":
        this.loadWhenIdle();
        break;

      default: // "load"
        this.handleLoad();
    }
  }

  // Load when browser is idle or after window load
  loadWhenIdle() {
    const timeout = parseInt(this.getAttribute("timeout"));
    const options = !isNaN(timeout) && timeout > 0 ? { timeout } : undefined;

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => this.handleLoad(), options);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      window.addEventListener("load", () => {
        // Add a small delay after load to lower priority
        setTimeout(() => this.handleLoad(), 0);
      });
    }
  }

  // Load when element becomes visible or timeout is reached
  setupVisibilityLoading() {
    const timeout = parseInt(this.getAttribute("timeout"));
    if (!isNaN(timeout) && timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.handleLoad();
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      }, timeout);
    }

    // Create intersection observer to detect when element's children enter viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.loaded) {
            if (this.timeoutId) {
              clearTimeout(this.timeoutId);
              this.timeoutId = null;
            }
            this.handleLoad();
            // Disconnect observer once loaded
            this.observer.disconnect();
            break;
          }
        }
      },
      {
        rootMargin: "50px",
        threshold: 0,
      }
    );

    // Observe all children instead of the island element itself
    for (const child of this.children) {
      this.observer.observe(child);
    }
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
    // Cleanup media query listener
    if (this.mediaQuery && !this.loaded) {
      this.mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }

  // Handle the load event
  handleLoad() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    // Handle template content if present
    const template = this.querySelector("template");
    if (template) {
      const content = template.content.cloneNode(true);
      template.replaceWith(content);
    }

    this.setAttribute("hydrated", "");
    this.dispatchEvent(
      new CustomEvent("island:hydrated", {
        bubbles: true,
        composed: true,
      })
    );
  }

  // Load when media query matches
  setupMediaLoading(query) {
    this.mediaQuery = window.matchMedia(query);

    const handleMediaChange = (e) => {
      if (e.matches && !this.loaded) {
        this.handleLoad();
        // Cleanup listener after loading
        this.mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };

    // Check initial state
    if (this.mediaQuery.matches) {
      this.handleLoad();
    } else {
      // Listen for changes if initial state doesn't match
      this.mediaQuery.addEventListener("change", handleMediaChange);
    }
  }
}

customElements.define("sapling-island", SaplingIsland);
