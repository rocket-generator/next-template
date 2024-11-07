import React from "react";
import { auth } from "@/libraries/auth";

import SideMenu from "@/components/organisms/SideMenu";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { UserRepository } from "@/repositories/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect, notFound } from "next/navigation";
import { User } from "@/models/user";

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
  console.log(me);

  return (
    <div className="min-h-screen flex">
      <SideMenu />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header signInUser={me} />
        <main className="p-6 flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
