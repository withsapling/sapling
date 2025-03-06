import { html, type HtmlContent } from "@sapling/sapling";

/**
 * Properties for the Picture component.
 */
interface PictureProps {
  src: string;
  alt: string;
  imgClass: string;
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

  return html`<picture>
    <!-- Large viewport -->
    <source
      media="(min-width: 1024px)"
      srcset="${src}-lg.avif"
      type="image/avif"
    />
    <!-- Medium viewport -->
    <source
      media="(min-width: 640px)"
      srcset="${src}-md.avif"
      type="image/avif"
    />
    <!-- Small viewport -->
    <source srcset="${src}-sm.avif" type="image/avif" />
    <!-- Fallback image -->
    <img
      src="${src}"
      alt="${alt}"
      class="${imgClass}"
      width="${width}"
      height="${height}"
      loading="${loading ?? "lazy"}"
      decoding="${decoding ?? "async"}"
    />
  </picture>`;
}
