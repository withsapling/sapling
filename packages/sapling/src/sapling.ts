import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";
import { html } from "@hexagon/proper-tags";
import type { LayoutProps } from "./types/index.ts";
import type { UserConfig } from "@unocss/core";

// Helper function to render HTML
export function render(html: string): Response {
	return new Response(html, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=UTF-8",
		},
	});
}

// Layout function adapted for raw Deno
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
  // Generate the CSS from the provided children
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
      ${props.disableTailwindReset ? html`` : html`<style>${resetStyles}</style>`}
			<!-- UnoCSS CSS -->
      <style>${css.css}</style>
      ${props.head}
    </head>
    ${props.bodyClass ? html`<body class="${props.bodyClass}">` : html`<body>`}
      ${props.children}
    </body>
    </html>
  `;
}
