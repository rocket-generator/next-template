import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type LinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string | URL;
    locale?: string | false;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
  }
>;

export default function Link({
  children,
  href,
  locale,
  prefetch,
  replace,
  scroll,
  shallow,
  ...anchorProps
}: LinkProps) {
  void locale;
  void prefetch;
  void replace;
  void scroll;
  void shallow;

  return (
    <a {...anchorProps} href={href.toString()}>
      {children}
    </a>
  );
}
