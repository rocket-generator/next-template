import React from "react";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth();
  if (session === null) {
    redirect("/auth/signin");
  }
  return <div>{children}</div>;
}
