import React, { Suspense } from "react";

import AppSidebar from "@/components/organisms/AppSidebar";
import Footer from "@/components/organisms/Footer";
import { UserRepository } from "@/repositories/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect } from "next/navigation";
import { User } from "@/models/user";
import { CheckCircle, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { signOutAction } from "./actions";
import { auth } from "@/libraries/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/atoms/sidebar";
import { SERVICE_NAME } from "@/constants/site";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth({ disableRefresh: true });
  if (!session) {
    redirect("/signin");
  }

  let me: User | null = null;
  try {
    const repository = new UserRepository();
    me = await repository.getMe();
  } catch (error) {
    console.log(error);
    if (error instanceof AuthError) {
      redirect("/signin");
    }
  }

  const t = await getTranslations("Menu.App");
  const tCommon = await getTranslations("Common");
  const menuItems = [
    {
      icon: <Home className="h-4 w-4" />,
      label: t("dashboard"),
      href: "/dashboard",
    },
  ];

  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <AppSidebar
          menuItems={menuItems}
          title={SERVICE_NAME}
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
          signInUser={me}
          onSignOut={signOutAction}
        />
      </Suspense>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <SidebarTrigger
            className="md:hidden"
            label={tCommon("open_sidebar")}
          />
          <span className="text-lg font-semibold">{SERVICE_NAME}</span>
        </header>
        <main className="p-6 flex-grow">{children}</main>
        <Footer />
      </div>
    </SidebarProvider>
  );
}
