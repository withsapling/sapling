import { html, type HtmlContent } from "@sapling/sapling";

/**
 * Properties for the Picture component.
 */
interface PictureProps {
  src: string;
  format?: "avif" | "webp" | "jpeg" | "png";
  alt: string;
  imgClass?: string;
  width: number;
  height: number;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
}

/**
 * Creates a picture element with source and fallback image.
 * @param props - The properties for the picture element.
 * @returns The HTML content for the picture element.
 */
export function Picture(props: PictureProps): HtmlContent {
  const { src, alt, imgClass, width, height, loading, decoding } = props;

  if (!src) {
    throw new Error("src is required");
  }

  const format = props.format ?? "avif";

  return html`<picture>
    <!-- Large viewport -->
    <source
      media="(min-width: 1024px)"
      srcset="${src}-lg.${format}"
      type="image/${format}"
    />
    <!-- Medium viewport -->
    <source
      media="(min-width: 640px)"
      srcset="${src}-md.${format}"
      type="image/${format}"
    />
    <!-- Small viewport -->
    <source srcset="${src}-sm.${format}" type="image/${format}" />
    <!-- Fallback image -->
    <img
      src="${src}-lg.${format}"
      alt="${alt}"
      class="${imgClass}"
      width="${width}"
      height="${height}"
      loading="${loading ?? "lazy"}"
      decoding="${decoding ?? "async"}"
    />
  </picture>`;
}
