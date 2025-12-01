# Sapling Island

A lightweight Web Component for implementing islands architecture in your web
applications. Islands architecture allows you to progressively hydrate parts of
your page, loading JavaScript and styles only when needed for optimal
performance.

## Installation

### NPM

```bash
npm install sapling-island
```

```javascript
import "sapling-island";
// or
import SaplingIsland from "sapling-island";
```

### CDN (jsDelivr)

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/sapling-island@0.2.0/index.js"
></script>
```

### Recommended CSS

Add this CSS to ensure proper rendering:

```css
sapling-island {
  display: contents;
}

/* Optional: Style hydrated islands */
sapling-island[hydrated] {
  /* Styles for hydrated state */
}
```

## Overview

Islands architecture is a pattern where most of your page remains static HTML,
with interactive "islands" that get hydrated with JavaScript when needed. This
approach significantly improves initial page load performance by deferring the
loading of non-critical JavaScript.

## Basic Usage

Wrap any content that requires JavaScript or additional styles in a
`<sapling-island>` component. Place scripts and styles inside the `<template>`
element to prevent them from loading until needed:

```html
<sapling-island>
  <template>
    <script src="/scripts/interactive.js" type="module"></script>
    <style>
      /* Styles that are only needed for this interactive component */
    </style>
  </template>
  <div>Your interactive content here</div>
</sapling-island>
```

## Loading Strategies

The component supports several loading strategies through the `loading`
attribute:

### Load (Default)

If no loading attribute is specified, or when set to "load", the island loads
immediately when the page loads:

```html
<!-- Without loading attribute (default) -->
<sapling-island>
  <template>
    <script src="/scripts/immediate.js" type="module"></script>
  </template>
  <div>Content that loads immediately</div>
</sapling-island>

<!-- Explicitly set to load -->
<sapling-island loading="load">
  <template>
    <script src="/scripts/immediate.js" type="module"></script>
  </template>
  <div>Content that loads immediately</div>
</sapling-island>
```

### Visible

Loads when the component becomes visible in the viewport:

```html
<sapling-island loading="visible">
  <template>
    <script src="/scripts/lazy.js" type="module"></script>
  </template>
  <div>This content loads when it becomes visible</div>
</sapling-island>
```

### Idle

Loads when the browser is idle:

```html
<sapling-island loading="idle">
  <template>
    <script src="/scripts/low-priority.js" type="module"></script>
  </template>
  <div>This content loads when the browser is idle</div>
</sapling-island>
```

### Media Query

Loads when a media query condition is met:

```html
<sapling-island loading="(min-width: 768px)">
  <template>
    <script src="/scripts/desktop-only.js" type="module"></script>
  </template>
  <div>This content loads only on desktop screens</div>
</sapling-island>

<sapling-island loading="(prefers-reduced-motion: no-preference)">
  <template>
    <script src="/scripts/animation.js" type="module"></script>
  </template>
  <div>This content loads only if user allows motion</div>
</sapling-island>
```

## Timeout Support

You can specify a timeout for loading strategies using the `timeout` attribute.
The island will hydrate when either the loading strategy condition is met OR the
timeout is reached, whichever comes first:

```html
<!-- Load when visible, but force load after 5 seconds -->
<sapling-island loading="visible" timeout="5000">
  <template>
    <script src="/scripts/important.js" type="module"></script>
  </template>
  <div>
    This will load when visible or after 5 seconds, whichever comes first
  </div>
</sapling-island>

<!-- Load when idle, but force load after 3 seconds -->
<sapling-island loading="idle" timeout="3000">
  <template>
    <script src="/scripts/feature.js" type="module"></script>
  </template>
  <div>This will load when idle or after 3 seconds</div>
</sapling-island>
```

## Events

The component dispatches a custom `island:hydrated` event when hydration is
complete:

```javascript
document.querySelector("sapling-island").addEventListener(
  "island:hydrated",
  () => {
    console.log("Island has been hydrated");
  },
);

// Or listen globally
document.addEventListener("island:hydrated", (event) => {
  console.log("Island hydrated:", event.target);
});
```

## Best Practices

### Template Content Only

Place `<script>` and `<style>` tags inside the `<template>` element to prevent
them from loading until needed:

```html
<sapling-island loading="visible">
  <template>
    <!-- Scripts and styles go here -->
    <script src="/scripts/feature.js" type="module"></script>
    <style>
      /* Feature styles */
    </style>
  </template>
  <!-- Actual content goes outside template -->
  <div class="feature">...</div>
</sapling-island>
```

### Progressive Enhancement

Design your islands to enhance existing static content rather than being
required for basic functionality:

```html
<!-- Static content works without JavaScript -->
<div class="content">Static content that works without JS</div>

<!-- Interactive features are added through islands -->
<sapling-island loading="visible">
  <template>
    <script src="/scripts/enhance.js" type="module"></script>
  </template>
  <div class="enhancement">Interactive features</div>
</sapling-island>
```

### Performance Considerations

- Use `visible` for below-the-fold content
- Use `idle` for non-critical enhancements
- Use media queries for device-specific features
- Set appropriate timeouts for critical features

## Complete Example: Interactive Time Display

```html
<sapling-island loading="visible">
  <template>
    <script>
      const time = document.querySelector("time");
    setInterval(() => {
      time.textContent = new Date().toLocaleTimeString();
    }, 1000);
    </script>
  </template>
  <div class="content">
    <p>The time updates every second after hydration:</p>
    <p>Current time: <time>00:00</time></p>
  </div>
</sapling-island>
```

## Attributes Reference

- `loading` - Loading strategy: `"load"` (default), `"visible"`, `"idle"`, or
  any CSS media query
- `timeout` - Maximum wait time in milliseconds before forcing load
- `hydrated` - Added automatically when content is loaded (useful for CSS
  styling)

## Browser Support

The sapling-island component uses standard web APIs and includes fallbacks for
broader browser support:

- Uses IntersectionObserver for visibility detection
- Falls back to setTimeout when requestIdleCallback is not available
- Supports all modern browsers that implement Custom Elements v1
- Modern browsers with ES6 module support

## Why Sapling Island?

- **Zero dependencies** - Pure vanilla JavaScript
- **Tiny footprint** - Under 5KB
- **Framework agnostic** - Works with any framework or vanilla HTML
- **Progressive enhancement** - Graceful fallbacks for older browsers
- **Flexible loading strategies** - Choose what works best for your content
- **Islands architecture** - Improve performance with selective hydration

You can read more about advanced usage in the
[sapling docs](https://sapling.land/docs/sapling-island).

## License

MIT License
