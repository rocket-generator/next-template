import type { ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  blurDataURL?: string;
  fill?: boolean;
  loader?: unknown;
  placeholder?: string;
  priority?: boolean;
  quality?: number | string;
  src: string | { src: string };
  unoptimized?: boolean;
};

export default function Image({
  blurDataURL,
  fill,
  loader,
  placeholder,
  priority,
  quality,
  src,
  unoptimized,
  ...imageProps
}: ImageProps) {
  void blurDataURL;
  void fill;
  void loader;
  void placeholder;
  void priority;
  void quality;
  void unoptimized;

  const resolvedSrc = typeof src === "string" ? src : src.src;
  return <img {...imageProps} src={resolvedSrc} />;
}
