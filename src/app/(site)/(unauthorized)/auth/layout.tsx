import React from "react";
import { auth } from "@/libraries/auth";
import { redirect } from "next/navigation";
import { User } from "@/models/user";
import { UserRepository } from "@/repositories/user_repository";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth();
  if (session) {
    let me: User | null = null;
    try {
      const repository = new UserRepository();
      me = await repository.getMe();
      console.log(me);
      redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}
