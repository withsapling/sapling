/**
 * HTML utility module for Sapling
 * Provides HTML template literal tag and utilities for safe HTML string handling
 * 
 * This module provides a safe way to create HTML strings with proper escaping
 * of special characters and support for async content, nested templates, and
 * arrays. We aim to be fully compatible with Hono's html module, allowing for
 * easy migration between the two.
 * 
 * Based on Hono's html module, released under the MIT license below:
 * 
 * Copyright (c) 2021 - present, Yusuke Wada and Hono contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Hono's html module code:
 * https://github.com/honojs/hono/blob/main/src/utils/html.ts
 * https://github.com/honojs/hono/blob/main/src/helper/html/index.ts
 * 
 * 
 * @example
 * ```ts
 * // Basic usage
 * const name = "World";
 * const content = html`<h1>Hello ${name}!</h1>`;
 * 
 * // With raw HTML
 * const rawHtml = raw('<strong>Bold</strong>');
 * const content = html`<div>${rawHtml}</div>`;
 * 
 * // With arrays
 * const items = ['a', 'b', 'c'];
 * const content = html`<ul>${items.map(item => html`<li>${item}</li>`)}</ul>`;
 * 
 * // With promises
 * const content = html`<div>${Promise.resolve('async content')}</div>`;
 * ```
 */

/**
 * Constants representing different phases of HTML callback processing
 * - Stringify: Initial string conversion phase
 * - BeforeStream: Pre-streaming preparation phase
 * - Stream: Active streaming phase
 */
export const HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3,
} as const;

/**
 * Options passed to HTML escaped callbacks
 * @property buffer - Optional single-element array containing the current string buffer
 * @property phase - Current processing phase from HtmlEscapedCallbackPhase
 * @property context - Read-only context object shared across the callback chain
 */
type HtmlEscapedCallbackOpts = {
  buffer?: [string];
  phase: (typeof HtmlEscapedCallbackPhase)[keyof typeof HtmlEscapedCallbackPhase];
  context: Readonly<object>;
};

/**
 * Callback function type for HTML escaped content processing
 * These callbacks can be used to modify or transform HTML content during different processing phases
 */
export type HtmlEscapedCallback = (opts: HtmlEscapedCallbackOpts) => Promise<string> | undefined;

/**
 * Interface for HTML escaped content
 * Marks content as already being properly escaped and safe to use
 */
export type HtmlEscaped = {
  isEscaped: true;
  callbacks?: HtmlEscapedCallback[];
};

/**
 * String type that has been HTML escaped
 * Combines string with HtmlEscaped interface to mark safe content
 */
export type HtmlEscapedString = string & HtmlEscaped;

/**
 * Internal buffer type for string processing
 * Can contain both regular strings and promises that resolve to strings
 */
type StringBuffer = (string | Promise<string>)[];

/**
 * Extended StringBuffer that includes callback functions
 * Used for processing HTML content with associated callbacks
 */
type StringBufferWithCallbacks = StringBuffer & { callbacks: HtmlEscapedCallback[] };

/**
 * Regular expression for matching HTML special characters that need escaping
 * Matches: & < > ' "
 */
const escapeRe = /[&<>'"]/;

/**
 * Creates a raw (pre-escaped) HTML string
 * Use this when you have HTML content that is already properly escaped
 * and should be inserted as-is without additional escaping
 * 
 * @param value - The pre-escaped content to wrap
 * @param callbacks - Optional array of callbacks to process the content
 * @returns An HtmlEscapedString that will be inserted as-is
 * 
 * @example
 * ```ts
 * const safeHtml = raw('<strong>Bold</strong>');
 * const content = html`<div>${safeHtml}</div>`;
 * ```
 */
export function raw(value: unknown, callbacks?: HtmlEscapedCallback[]): HtmlEscapedString {
  const escapedString = new String(value) as HtmlEscapedString;
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}

/**
 * Escapes HTML special characters in a string and adds to buffer
 * This is the core escaping function that handles the conversion of
 * special characters to their HTML entity equivalents
 * 
 * Handles the following conversions:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#39;
 * 
 * @param str - The string to escape
 * @param buffer - The buffer to append the escaped string to
 */
export const escapeToBuffer = (str: string, buffer: StringBuffer): void => {
  const match = str.search(escapeRe);
  if (match === -1) {
    buffer[0] += str;
    return;
  }

  let escape;
  let index;
  let lastIndex = 0;

  for (index = match; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }

  buffer[0] += str.substring(lastIndex, index);
};

/**
 * Converts a string buffer to a single string, resolving any promises
 * This function handles the complex task of combining multiple strings
 * and promises into a single escaped HTML string
 * 
 * The buffer is processed from right to left (end to start) because
 * new items are unshifted to the front of the buffer during HTML processing.
 * This ensures proper ordering of dynamic content.
 * 
 * For example, given a buffer: ['end', Promise('middle'), 'start']
 * Processing from right to left ensures 'start' + 'middle' + 'end' order
 * 
 * @param buffer - Array of strings and promises to combine
 * @param callbacks - Optional callbacks to process the final string
 * @returns Promise resolving to the final HtmlEscapedString
 */
export const stringBufferToString = async (
  buffer: StringBuffer,
  callbacks: HtmlEscapedCallback[] | undefined
): Promise<HtmlEscapedString> => {
  let str = '';
  // Initialize callbacks array if undefined
  callbacks ||= [];
  // Wait for all promises in the buffer to resolve
  const resolvedBuffer = await Promise.all(buffer);

  // Process buffer from right to left (end to start)
  // The loop processes pairs of items: [string, value] where value needs escaping
  for (let i = resolvedBuffer.length - 1; ; i--) {
    // Add the string part (always present)
    str += resolvedBuffer[i];
    i--;
    // Exit if we've processed all pairs
    if (i < 0) {
      break;
    }

    // Process the value part that needs escaping
    let r = resolvedBuffer[i];
    // If it's an object, collect any callbacks it might have
    if (typeof r === 'object') {
      callbacks.push(...((r as HtmlEscapedString).callbacks || []));
    }

    // Check if the value is already escaped before converting to string
    const isEscaped = (r as HtmlEscapedString).isEscaped;
    // Convert to string, handling objects specially
    r = await (typeof r === 'object' ? (r as HtmlEscapedString).toString() : r);
    // Collect callbacks again after toString (in case it generated new ones)
    if (typeof r === 'object') {
      callbacks.push(...((r as HtmlEscapedString).callbacks || []));
    }

    // If the content is already escaped (either originally or after toString),
    // add it directly. Otherwise, escape it first
    if ((r as HtmlEscapedString).isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }

  // Return the final string wrapped as a raw (pre-escaped) HTML string
  // along with any collected callbacks
  return raw(str, callbacks);
};

/**
 * Synchronously resolves callbacks for a string
 * Used when the content can be processed immediately without async operations
 * 
 * @param str - The string to process
 * @returns The processed string
 */
export const resolveCallbackSync = (str: string | HtmlEscapedString): string => {
  const callbacks = (str as HtmlEscapedString).callbacks as HtmlEscapedCallback[];
  if (!callbacks?.length) {
    return str;
  }
  const buffer: [string] = [str];
  const context = {};

  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));

  return buffer[0];
};

/**
 * Asynchronously resolves callbacks for a string
 * Handles complex async operations and nested callbacks
 * 
 * @param str - The string or promise to process
 * @param phase - Current processing phase
 * @param preserveCallbacks - Whether to keep callbacks after processing
 * @param context - Shared context object
 * @param buffer - Optional buffer to append results to
 * @returns Promise resolving to the processed string
 */
export const resolveCallback = async (
  str: string | HtmlEscapedString | Promise<string>,
  phase: (typeof HtmlEscapedCallbackPhase)[keyof typeof HtmlEscapedCallbackPhase],
  preserveCallbacks: boolean,
  context: object,
  buffer?: [string]
): Promise<string> => {
  // Handle various object types that need to be converted to strings
  if (typeof str === 'object' && !(str instanceof String)) {
    // If it's an object but not a Promise, convert it to string
    if (!((str as unknown) instanceof Promise)) {
      str = (str as unknown as string).toString();
    }
    // If it's a Promise (or became one after toString), await its resolution
    if ((str as string | Promise<string>) instanceof Promise) {
      str = await (str as unknown as Promise<string>);
    }
  }

  // Extract any callbacks attached to the string
  const callbacks = (str as HtmlEscapedString).callbacks as HtmlEscapedCallback[];
  // If there are no callbacks, return the string as-is
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }

  // If we have an existing buffer, append to it
  // Otherwise create a new single-element buffer array
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str as string];
  }

  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then((res) =>
    Promise.all(
      res
        // deno-lint-ignore no-explicit-any
        .filter<string>(Boolean as any)
        .map((str) => resolveCallback(str, phase, false, context, buffer))
    ).then(() => (buffer as [string])[0])
  );

  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

/**
 * HTML template literal tag function
 * This is the main entry point for creating HTML content
 * It safely escapes interpolated values and handles various types of content:
 * - Strings (escaped)
 * - Numbers (converted to strings)
 * - Booleans, null, undefined (ignored)
 * - Arrays (flattened and processed)
 * - Promises (resolved)
 * - Pre-escaped content (inserted as-is)
 * 
 * @param strings - Template literal strings
 * @param values - Interpolated values to process
 * @returns HtmlEscapedString or Promise<HtmlEscapedString>
 * 
 * @example
 * ```ts
 * const name = "World";
 * const content = html`<h1>Hello ${name}!</h1>`;
 * ```
 */
export const html = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): HtmlEscapedString | Promise<HtmlEscapedString> => {
  const buffer: StringBufferWithCallbacks = [''] as StringBufferWithCallbacks;

  for (let i = 0, len = strings.length - 1; i < len; i++) {
    buffer[0] += strings[i];

    const children = Array.isArray(values[i])
      ? (values[i] as Array<unknown>).flat(Infinity)
      : [values[i]];
    for (let i = 0, len = children.length; i < len; i++) {
      // Process each child value based on its type
      // deno-lint-ignore no-explicit-any
      const child = children[i] as any;

      // Plain strings need to be escaped to prevent XSS
      if (typeof child === 'string') {
        escapeToBuffer(child, buffer);
      }
      // Numbers can be safely converted to strings without escaping
      else if (typeof child === 'number') {
        (buffer[0] as string) += child;
      }
      // Skip falsy values to support conditional rendering
      // e.g. ${condition && <div>...</div>}
      else if (typeof child === 'boolean' || child === null || child === undefined) {
        continue;
      }
      // Handle pre-escaped content (created by html`` or raw())
      else if (typeof child === 'object' && (child as HtmlEscaped).isEscaped) {
        if ((child as HtmlEscapedString).callbacks) {
          // If the content has callbacks, add it to the start of buffer
          // This ensures callbacks are processed in the correct order
          buffer.unshift('', child);
        } else {
          // For pre-escaped content without callbacks
          const tmp = child.toString();
          if (tmp instanceof Promise) {
            // Handle async pre-escaped content
            buffer.unshift('', tmp);
          } else {
            // Add pre-escaped content directly without re-escaping
            buffer[0] += tmp;
          }
        }
      }
      // Handle promises (async content)
      // e.g. ${Promise.resolve('content')}
      else if (child instanceof Promise) {
        buffer.unshift('', child);
      }
      // For any other type, convert to string and escape
      // This handles objects, arrays, etc.
      else {
        escapeToBuffer(child.toString(), buffer);
      }
    }
  }
  buffer[0] += strings.at(-1) as string;

  return buffer.length === 1
    ? 'callbacks' in buffer
      ? raw(resolveCallbackSync(raw(buffer[0], buffer.callbacks)))
      : raw(buffer[0])
    : stringBufferToString(buffer, buffer.callbacks);
};
