import React from "react";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}
