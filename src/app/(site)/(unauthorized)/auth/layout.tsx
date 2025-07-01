import React from "react";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth();

  // ログイン済みの場合はダッシュボードにリダイレクト
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}
