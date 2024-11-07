import React from "react";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  return <div>{children}</div>;
}
