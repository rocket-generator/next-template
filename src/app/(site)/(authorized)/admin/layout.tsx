import React, { Suspense } from "react";
import { Users, Settings, Home, BarChart2, CheckCircle } from "lucide-react";

import AdminSidebar from "@/components/organisms/AdminSidebar";
import AdminFooter from "@/components/organisms/AdminFooter";
import { UserRepository } from "@/repositories/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect, notFound } from "next/navigation";
import { User } from "@/models/user";
import { getTranslations } from "next-intl/server";
import { signOutAction } from "./actions";
import { SidebarProvider, SidebarTrigger } from "@/components/atoms/sidebar";
import { SERVICE_NAME } from "@/constants/site";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
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
  if (!me || !me.permissions.includes("admin")) {
    return notFound();
  }
  const t = await getTranslations("Menu.Admin");
  const tCommon = await getTranslations("Common");
  const menuItems = [
    {
      icon: <Home className="h-4 w-4" />,
      label: t("dashboard"),
      href: "/admin/dashboard",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: t("users"),
      href: "/admin/users",
    },
    /* [REGISTER_MENU_ITEMS] */
    {
      icon: <BarChart2 className="h-4 w-4" />,
      label: t("statistics"),
      href: "/admin/statistics",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: t("settings"),
      href: "/admin/settings",
    },
  ];
  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminSidebar
          menuItems={menuItems}
          title={`${SERVICE_NAME} Admin`}
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
          <span className="text-lg font-semibold">{`${SERVICE_NAME} Admin`}</span>
        </header>
        <main className="p-6 flex-grow">{children}</main>
        <AdminFooter />
      </div>
    </SidebarProvider>
  );
}
