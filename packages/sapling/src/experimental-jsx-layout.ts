import { html, raw } from '@hono/hono/html'
import { createGenerator } from "@unocss/core";
import { presetUno } from "@unocss/preset-uno";
import type { UserConfig } from "@unocss/core";
import type { ExperimentalJSXLayoutProps } from "./types/index.ts";
import { SAPLING_VERSION } from "./constants.ts";
import type { HtmlEscapedString } from "@hono/hono/utils/html";

export async function ExperimentalJSXLayout(props: ExperimentalJSXLayoutProps): Promise<HtmlEscapedString> {
  let resetStyles = ``;
  let css = ``; 

  // Tailwind Reset Minified
  resetStyles = `*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:var(--un-default-border-color,#e5e7eb)}::after,::before{--un-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}`;

  let config: UserConfig = {
    presets: [presetUno()],
  };

  if (props.unoConfig) {
    config = props.unoConfig;
  }

  // Create the UnoCSS generator
  const generator =  await createGenerator(config);
  // Generate the CSS from the provided children and body class
   css = (await generator.generate(
      `${props.children}`
  )).css;

  return html`<!doctype html>
      <html>
        <head>
          <title>${props.title}</title>
          ${props.enableIslands ? html`<script type="module" src="https://sapling-is.land"></script><style>sapling-island{display:contents}</style>
            ` : ``}
          <style>${raw(resetStyles)}</style>
          <style>${raw(css)}</style>
          ${props.head}
        </head>
        <body>
          ${props.children}
        </body>
      </html>`
}

