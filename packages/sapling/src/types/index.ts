import type { UserConfig } from "@unocss/core";
import type { HtmlEscapedString } from "@hono/hono/utils/html";

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
  head?: string | HtmlEscapedString | TemplateStringsArray;
  /**
   * The body content
   */
  children: string | HtmlEscapedString | TemplateStringsArray;
	/**
	 * Provide a custom body class
	 */
	bodyClass?: string;
}