import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";
import { html, raw } from "@hono/hono/html";
import type { LayoutProps } from "./types/index.ts";
import type { UserConfig } from "@unocss/core";

/**
 * The Layout function creates an HTML document with UnoCSS support and optional Tailwind reset styles.
 * 
 * @returns A Promise that resolves to the complete HTML document as a string
 * 
 * @param props - The properties for the layout
 * @param props.unoConfig - Optional custom UnoCSS configuration. If not provided, uses the default UnoCSS preset
 * @param props.disableTailwindReset - When true, removes the default Tailwind reset styles
 * @param props.head - Additional content to inject into the document's head section
 * @param props.bodyClass - Optional class string to add to the body element
 * @param props.children - The content to render in the body of the page
 * 
 * @example
 * ```ts
 * // Basic usage
 * const html = await Layout({ children: html`<h1>Hello World</h1>` });
 * ```
 */
export async function Layout(props: LayoutProps): Promise<string> {

  // UnoCSS config
  let config: UserConfig;
  // If no config is provided, use the default UnoCSS preset
  if (props.unoConfig) {
    config = props.unoConfig;
  } else {
    config = {
      presets: [presetUno()],
    };
  }
  // Create the UnoCSS generator
  const generator = createGenerator(config);
  // Generate the CSS from the provided children and body class
  const css = await generator.generate(`${props.bodyClass ? `${props.bodyClass} ` : ``} ${props.children}`);

  // Tailwind Reset Minified
  let resetStyles =
    `*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:var(--un-default-border-color,#e5e7eb)}::after,::before{--un-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}`;

  // If the tailwind reset is disabled, remove the default tailwind reset
  if (props.disableTailwindReset) {
    resetStyles = ``;
  }

  // Return the HTML
  return html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta name="generator" content="Sapling v0.1.0">
      ${props.disableTailwindReset ? html`` : html`<style>${raw(resetStyles)}</style>`}
			<!-- UnoCSS CSS -->
      <style>${raw(css.css)}</style>
      ${props.head}
    </head>
    ${props.bodyClass ? html`<body class="${props.bodyClass}">` : html`<body>`}
      ${props.children}
    </body>
    </html>
  `;
}
