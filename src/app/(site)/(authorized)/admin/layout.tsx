import React, { Suspense } from "react";
import { Users, Home, CheckCircle } from "lucide-react";

import AdminSidebar from "@/components/organisms/AdminSidebar";
import AdminFooter from "@/components/organisms/AdminFooter";
import { UserRepository } from "@/repositories/user_repository";
import { User } from "@/models/user";
import { getTranslations } from "next-intl/server";
import { signOutAction } from "./actions";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/libraries/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/atoms/sidebar";
import { SERVICE_NAME } from "@/constants/site";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await requireAdminSession();
  const repository = new UserRepository();
  const me: User | null = await repository.getUserById(session.user.id);
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
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <SidebarTrigger
            className="md:hidden"
            label={tCommon("open_sidebar")}
          />
          <span className="text-lg font-semibold">{`${SERVICE_NAME} Admin`}</span>
        </header>
        <main className="min-w-0 flex-grow p-6">{children}</main>
        <AdminFooter />
      </div>
    </SidebarProvider>
  );
}
