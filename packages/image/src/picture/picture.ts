import { html } from "@sapling/sapling";

interface PictureProps {
  src: string;
  alt: string;
  imgClass: string;

  width: number;
  height: number;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
}

export function Picture(props: PictureProps) {
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
