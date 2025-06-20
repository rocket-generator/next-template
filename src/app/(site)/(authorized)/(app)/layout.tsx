import React from "react";

import SideMenu from "@/components/organisms/SideMenu";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { UserRepository } from "@/repositories/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect, notFound } from "next/navigation";
import { User } from "@/models/user";
import { CheckCircle, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { signOutAction } from "./actions";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  let me: User | null = null;
  try {
    const repository = new UserRepository();
    me = await repository.getMe();
    console.log(me);
  } catch (error) {
    console.log(error);
    if (error instanceof AuthError) {
      redirect("/auth/signin");
    }
  }
  if (!me) {
    return notFound();
  }
  const t = await getTranslations("Menu.App");
  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: t("dashboard"),
      href: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen flex">
      <SideMenu
        menuItems={menuItems}
        title="TaskMaster"
        icon={<CheckCircle className="w-8 h-8 text-blue-600" />}
      />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header signInUser={me} onSignOut={signOutAction} />
        <main className="p-6 flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
