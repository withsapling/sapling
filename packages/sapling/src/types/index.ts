import type { UserConfig } from "@unocss/core";
import type { HtmlEscapedString } from "@hono/hono/utils/html";
import type { Context, Middleware } from "../sapling.ts";

export type HtmlContent = string | HtmlEscapedString | Promise<HtmlEscapedString> | TemplateStringsArray;

export interface LayoutProps {
  /**
   * Pass an optional custom UnoCSS config
   */
  unoConfig?: UserConfig;
  /**
   * Whether to disable the tailwind reset
   */
  disableTailwindReset?: boolean;
  /**
   * The head content
   */
  head?: HtmlContent;
  /**
   * Provide a custom body class
   */
  bodyClass?: string;
  /**
   * The children content to render in the body of the page
   */
  children: HtmlContent;
  /**
   * When true, returns a ReadableStream to stream the HTML output. Defaults to false
   */
  stream?: boolean;
}

// export Context type
export type { Context, Middleware };

