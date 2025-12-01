![A Simpler Web Framework](.github/assets/gh-banner.jpg 'A Simpler Web Framework')


# Sapling

A framework agnostic, runtime agnostic, and router agnostic web-standards driven islands architecture solution for implementing selective hydration in your web applications.

Islands architecture allows you to progressively hydrate parts of your page, loading JavaScript and styles only when needed for optimal performance. Most of your page remains static HTML, with interactive "islands" that get hydrated with JavaScript when needed.

 - **Zero dependencies** - Pure vanilla JavaScript web components
 - **Framework agnostic** - Works with any framework or vanilla HTML  
 - **Multiple loading strategies** - Load on visibility, idle time, media queries, or immediately
 - **Web standards driven** - Built on Custom Elements and other standard APIs
 - **Tiny footprint** - Under 2KB for the core island component


## Getting Started  

### NPM
```bash
npm install sapling-island
```

```javascript
import 'sapling-island';
```

### CDN
```html
<script type="module" src="https://sapling-is.land"></script>
```

### Basic Usage

Wrap any content that requires JavaScript in a `<sapling-island>` component:

```html
<sapling-island loading="visible">
  <template>
    <script src="/scripts/interactive.js" type="module"></script>
    <style>/* Styles only loaded when needed */</style>
  </template>
  <div>Your interactive content here</div>
</sapling-island>
```

### Loading Strategies

- `loading="load"` - Load immediately (default)
- `loading="visible"` - Load when visible in viewport  
- `loading="idle"` - Load when browser is idle
- `loading="(min-width: 768px)"` - Load based on media query
- `timeout="5000"` - Force load after timeout

## Packages

| Package | Description | Version |
|---------|-------------|-----|
| [create](./packages/create/) | A CLI for creating Sapling projects | [![JSR](https://jsr.io/badges/@sapling/create)](https://jsr.io/@sapling/create) |
| [create-sapling](./packages/create-sapling/) | A CLI for creating Sapling projects with npm | [![npm](https://img.shields.io/npm/v/create-sapling.svg)](https://www.npmjs.com/package/create-sapling) |
| [sapling-island](./packages/sapling-island/) | A web component for partial hydration | [CDN](https://sapling-is.land) |

## Example: Interactive Time Display

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
  <div>
    <p>The time updates every second after hydration:</p>
    <p>Current time: <time>00:00</time></p>
  </div>
</sapling-island>
```

## More Examples

Check out the [Sapling Examples Repository](https://github.com/withsapling/examples) for more examples of islands architecture patterns.

## Why Islands Architecture?

Islands architecture significantly improves web performance by:

- **Reducing JavaScript bundle size** - Only load what's needed
- **Faster initial page loads** - Most content remains static HTML  
- **Better Core Web Vitals** - Less JavaScript means better LCP and CLS scores
- **Progressive enhancement** - Works even when JavaScript fails to load
- **Selective hydration** - Hydrate components based on user interaction patterns

## Browser Support

- Uses standard Web APIs (Custom Elements, IntersectionObserver)
- Falls back gracefully for older browsers
- Supports all modern browsers with ES6 module support