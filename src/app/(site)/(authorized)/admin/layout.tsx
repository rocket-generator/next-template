import React from "react";
import { auth } from "@/libraries/auth";
import { Users, Settings, Home, BarChart2, CheckCircle } from "lucide-react";

import SideMenu from "@/components/organisms/SideMenu";
import AdminHeader from "@/components/organisms/AdminHeader";
import AdminFooter from "@/components/organisms/AdminFooter";
import { UserRepository } from "@/repositories/admin/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect, notFound } from "next/navigation";
import { User } from "@/models/admin/user";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth();
  let me: User | null = null;
  try {
    const repository = new UserRepository(session?.access_token);
    me = await repository.getMe();
  } catch (error) {
    console.log(error);
    if (error instanceof AuthError) {
      redirect("/auth/signin");
    }
  }
  if (!me || !me.permissions.includes("admin")) {
    return notFound();
  }
  const t = await getTranslations("Menu.Admin");
  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: t("dashboard"),
      href: "/admin/dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t("users"),
      href: "/admin/users",
    },
    /* [REGISTER_MENU_ITEMS] */
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: "統計",
      href: "/admin/statistics",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "設定",
      href: "/admin/settings",
    },
  ];
  return (
    <div className="min-h-screen flex">
      <SideMenu
        menuItems={menuItems}
        title="Admin Panel"
        icon={<CheckCircle className="w-8 h-8 text-blue-600" />}
      />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <AdminHeader signInUser={me} />
        <main className="p-6 flex-grow">{children}</main>
        <AdminFooter />
      </div>
    </div>
  );
}
