import type { JSX } from "hono/jsx/jsx-runtime";

export interface LayoutProps {
  /**
   * Whether to enable Sapling Islands functionality
   */
  enableIslands?: boolean;
  /**
   * Whether to disable the generator meta tag
   */
  disableGeneratorTag?: boolean;
  /**
   * The head content
   */
  head?: string | Promise<string>;
  /**
   * Provide a custom body class
   */
  bodyClass?: string;
  /**
   * The language attribute for the HTML tag. Defaults to "en"
   */
  lang?: string;
  /**
   * The children content to render in the body of the page
   */
  children: string | Promise<string> | Element | JSX.Element;
}
