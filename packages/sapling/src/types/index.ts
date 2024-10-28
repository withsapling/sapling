import type { UserConfig } from "@unocss/core";

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
  head?: TemplateStringsArray;
  /**
   * The body content
   */
  children: TemplateStringsArray;
	/**
	 * Provide a custom body class
	 */
	bodyClass?: string;
}