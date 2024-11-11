import type { UserConfig } from "@unocss/core";
import type { HtmlEscapedString } from "@hono/hono/utils/html";

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
}

