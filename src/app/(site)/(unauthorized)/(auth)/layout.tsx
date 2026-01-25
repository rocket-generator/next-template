import React from "react";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const shouldRedirectAuthenticatedUser =
    process.env.ENABLE_AUTH_PAGE_REDIRECT !== "false";
  const session = await auth({ disableRefresh: true });
  if (session && shouldRedirectAuthenticatedUser) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}
