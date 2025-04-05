import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";
import type { LayoutProps } from "./types/index.ts";
import type { UserConfig } from "@unocss/core";
import { SAPLING_VERSION } from "./constants.ts";
import { html, raw } from "@hono/hono/html";
import type { HtmlEscapedString } from "@hono/hono/utils/html";


/**
 * The Layout function creates an HTML document with UnoCSS support and optional Tailwind reset styles.
 *
 * @returns A Promise that resolves to the complete HTML document as a string or a ReadableStream that streams the HTML document
 *
 * @param props - The properties for the layout
 * @param props.unoConfig - Optional custom UnoCSS configuration. If not provided, uses the default UnoCSS preset
 * @param props.disableTailwindReset - When true, removes the default Tailwind reset styles
 * @param props.head - Additional content to inject into the document's head section
 * @param props.bodyClass - Optional class string to add to the body element
 * @param props.children - The content to render in the body of the page
 * @param props.stream - When true, returns a ReadableStream to stream the HTML output. Defaults to false
 * @param props.disableUnoCSS - When true, skips UnoCSS generation
 * @param props.enableIslands - When true, adds the islands script and CSS
 * @param props.lang - Optional language for the HTML document
 * @param props.disableGeneratorTag - When true, skips the generator meta tag
 *
 * @example
 * ```ts
 * // Basic usage (non-streaming)
 * const html = await Layout({ children: html`<h1>Hello World</h1>` });
 *
 * // Streaming usage
 * const stream = Layout({ children: html`<h1>Hello World</h1>`, stream: true });
 * ```
 */
export function ExperimentalJSXLayout(props: LayoutProps): Promise<HtmlEscapedString> | ReadableStream {
  // UnoCSS config and generator setup
  let config: UserConfig = {
    presets: [presetUno()],
  };
  let css = { css: "" }; // Default empty CSS if UnoCSS is disabled

  // Only setup UnoCSS if not disabled
  if (!props.disableUnoCSS) {
    // If no config is provided, use the default UnoCSS preset
    if (props.unoConfig) {
      config = props.unoConfig;
    }
  }

  // Tailwind Reset Minified
  let resetStyles = `*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:var(--un-default-border-color,#e5e7eb)}::after,::before{--un-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}`;

  // If the tailwind reset is disabled, remove the default tailwind reset
  if (props.disableTailwindReset) {
    resetStyles = ``;
  }

  // Non-streaming (original) logic
  if (!props.stream) {
    return (async () => {
      // Only generate UnoCSS if not disabled
      if (!props.disableUnoCSS) {
        // Create the UnoCSS generator
        const generator = await createGenerator(config);
        // Generate the CSS from the provided children and body class
        css = await generator.generate(
          `${props.bodyClass ? `${props.bodyClass} ` : ``} ${props.children}`
        );
      }

      // Return the HTML as a string
      return html`
        <!DOCTYPE html>
        <html lang="${props.lang || "en"}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${
            props.disableGeneratorTag
              ? ""
              : raw(`<meta name="generator" content="Sapling v${SAPLING_VERSION}">`)  
          }
          ${props.disableTailwindReset ? "" : raw(`<style>${resetStyles}</style>`)}
          ${
            !props.disableUnoCSS
              ? raw(`<!-- UnoCSS CSS -->
          <style>${css.css}</style>`)
              : ""
          }
          ${
            props.enableIslands
              ? raw(`
          <!-- Sapling Islands -->
          <script type="module" src="https://sapling-is.land"></script>
          <style>sapling-island{display:contents}</style>
          `)
              : ""
          }
          ${props.head}
        </head>
        ${props.bodyClass ? raw(`<body class="${props.bodyClass}">`) : raw(`<body>`)}
          ${props.children}
        </body>
        </html>
      `;
    })();
  }

  // Streaming logic
  return new ReadableStream({
    async start(controller) {
      // Only generate UnoCSS if not disabled
      if (!props.disableUnoCSS) {
        // Create the UnoCSS generator
        const generator = await createGenerator(config);
        // Generate the CSS from the provided children and body class
        css = await generator.generate(
          `${props.bodyClass ? `${props.bodyClass} ` : ``} ${props.children}`
        );
      }

      // Enqueue the beginning of the HTML document
      controller.enqueue(
        new TextEncoder().encode(
          `<!DOCTYPE html>
          <html lang="${props.lang || "en"}">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${
              props.disableGeneratorTag
                ? ``
                : `<meta name="generator" content="Sapling v${SAPLING_VERSION}">`
            }
            ${props.disableTailwindReset ? `` : `<style>${resetStyles}</style>`}
            ${
              !props.disableUnoCSS
                ? `<!-- UnoCSS CSS -->
            <style>${css.css}</style>`
                : ``
            }
            ${
              props.enableIslands
                ? `
            <!-- Sapling Islands -->
            <script type="module" src="https://sapling-is.land"></script>
            <style>sapling-island{display:contents}</style>
            `
                : ``
            }
            ${props.head}`
        )
      );

      // Enqueue the body and the rest of the HTML
      controller.enqueue(
        new TextEncoder().encode(
          `${props.bodyClass ? `<body class="${props.bodyClass}">` : `<body>`}
            ${props.children}
          </body>
          </html>`
        )
      );

      // Close the stream
      controller.close();
    },
  });
}
